import yaml
from ai_cto.actions.base import Action
from ai_cto.llm import LLMClient


class AnalyzeWorkflows(Action):
    name: str = "analyze_workflows"
    description: str = "Analyze workflow YAML for CI/CD issues"
    
    def run(self, **kwargs) -> dict:
        issues = []
        workflows = kwargs.get("workflows", [])
        
        print(f"DEBUG: Analyzing {len(workflows)} workflows...")
        
        for wf in workflows:
            content = wf.get("content", "")
            wf_name = wf.get("name", "unknown")
            
            if not content:
                issues.append({"workflow": wf_name, "issue": "Empty content", "severity": "low"})
                continue
            
            try:
                data = yaml.safe_load(content)
            except Exception as e:
                issues.append({"workflow": wf_name, "issue": f"Invalid YAML: {str(e)}", "severity": "medium"})
                continue
            
            if not data:
                issues.append({"workflow": wf_name, "issue": "Empty workflow", "severity": "low"})
                continue
            
            jobs = data.get("jobs", {})
            if not jobs:
                issues.append({"workflow": wf_name, "issue": "No jobs defined", "severity": "low"})
                continue
            
            has_cache = any("cache" in str(step.get("uses", "")).lower() 
                          for job in jobs.values() if isinstance(job, dict)
                          for step in job.get("steps", []))
            if not has_cache:
                issues.append({"workflow": wf_name, "issue": "No caching configured", "severity": "medium"})
            
            install_count = sum(1 for job in jobs.values() if isinstance(job, dict)
                              for step in job.get("steps", [])
                              if isinstance(step, dict) and ("npm install" in str(step.get("run", "")).lower() or "pip install" in str(step.get("run", "")).lower() or "yarn install" in str(step.get("run", "")).lower()))
            if install_count > 1:
                issues.append({"workflow": wf_name, "issue": f"Repeated installs ({install_count}x)", "severity": "low"})
            
            has_parallel = any(isinstance(job, dict) and job.get("needs") for job in jobs.values())
            if not has_parallel and len(jobs) > 1:
                jobs_with_needs = sum(1 for job in jobs.values() if isinstance(job, dict) and job.get("needs"))
                if jobs_with_needs == 0:
                    issues.append({"workflow": wf_name, "issue": "Jobs could run in parallel", "severity": "low"})
        
        print(f"DEBUG: Found {len(issues)} issues")
        return {"issues": issues}


class SuggestImprovements(Action):
    name: str = "suggest_improvements"
    description: str = "Use AI to generate CI/CD improvement suggestions"
    
    def run(self, **kwargs) -> dict:
        issues = kwargs.get("issues", [])
        repo = kwargs.get("repo", "")
        
        print(f"DEBUG: Generating suggestions for {len(issues)} issues...")
        
        if not issues:
            return {"suggestions": ["No issues found - workflow looks good!", "Consider adding more test coverage."]}
        
        issues_text = "\n".join([f"- {i.get('workflow', 'unknown')}: {i.get('issue', 'N/A')}" for i in issues])
        
        prompt = f"""As an AI CTO, suggest improvements for this GitHub Actions CI/CD setup.

Repo: {repo}

Issues found:
{issues_text}

Provide 3-5 specific, actionable bullet point suggestions. Keep each concise."""

        llm = LLMClient()
        response = llm.generate(prompt)
        
        suggestions = [s.strip().lstrip("- ").lstrip("* ") for s in response.strip().split("\n") if s.strip()]
        
        print(f"DEBUG: Generated {len(suggestions)} suggestions")
        return {"suggestions": suggestions}
