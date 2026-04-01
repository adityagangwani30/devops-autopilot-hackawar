import yaml
from ai_cto.actions.base import Action
from ai_cto.llm import LLMClient


class AnalyzeWorkflows(Action):
    name: str = "analyze_workflows"
    description: str = "Analyze workflow YAML for CI/CD issues"
    
    def run(self, **kwargs) -> dict:
        issues = []
        workflows = kwargs.get("workflows", [])
        
        print(f"\n🔍 Analyzing {len(workflows)} workflows...")
        
        for wf in workflows:
            content = wf.get("content", "")
            wf_name = wf.get("name", "unknown")
            
            if not content:
                issues.append({"workflow": wf_name, "issue": "Empty content", "severity": "low"})
                continue
            
            try:
                data = yaml.safe_load(content)
            except Exception as e:
                issues.append({"workflow": wf_name, "issue": f"Invalid YAML: {str(e)[:50]}", "severity": "medium"})
                continue
            
            if not data:
                issues.append({"workflow": wf_name, "issue": "Empty workflow", "severity": "low"})
                continue
            
            # Check for jobs at top level or in workflow_call triggers
            jobs = data.get("jobs", {})
            
            # If no jobs, check if it's calling another workflow
            if not jobs:
                if "workflow_call" in data.get("on", {}):
                    continue  # Workflow call is fine
                issues.append({"workflow": wf_name, "issue": "No jobs defined", "severity": "low"})
                continue
            
            # Check for caching in uses or with cache key
            has_cache = False
            for job_name, job in jobs.items() if isinstance(jobs, dict) else []:
                if isinstance(job, dict):
                    steps = job.get("steps", [])
                    if steps:
                        for step in steps:
                            if isinstance(step, dict):
                                uses = str(step.get("uses", "")).lower()
                                if "cache" in uses:
                                    has_cache = True
                                    break
                    if has_cache:
                        break
            
            if not has_cache:
                issues.append({"workflow": wf_name, "issue": "No caching configured", "severity": "medium"})
            
            # Count install commands
            install_keywords = ["npm install", "npm ci", "pip install", "pip3 install", 
                               "yarn install", "bundle install", "go mod download",
                               "cargo fetch", "poetry install"]
            
            install_count = 0
            for job_name, job in jobs.items() if isinstance(jobs, dict) else []:
                if isinstance(job, dict):
                    steps = job.get("steps", [])
                    if steps:
                        for step in steps:
                            if isinstance(step, dict):
                                run_cmd = str(step.get("run", "")).lower()
                                for keyword in install_keywords:
                                    if keyword in run_cmd:
                                        install_count += 1
                                        break
            
            if install_count > 1:
                issues.append({"workflow": wf_name, "issue": f"Repeated installs ({install_count}x)", "severity": "low"})
            
            # Check for parallel execution opportunity
            if len(jobs) > 1:
                has_dependencies = False
                for job_name, job in jobs.items() if isinstance(jobs, dict) else []:
                    if isinstance(job, dict) and job.get("needs"):
                        has_dependencies = True
                        break
                
                if not has_dependencies:
                    issues.append({"workflow": wf_name, "issue": "Jobs could run in parallel", "severity": "low"})
        
        print(f"✅ Found {len(issues)} issues")
        return {"issues": issues}


class SuggestImprovements(Action):
    name: str = "suggest_improvements"
    description: str = "Use AI to generate CI/CD improvement suggestions"
    
    def run(self, **kwargs) -> dict:
        issues = kwargs.get("issues", [])
        repo = kwargs.get("repo", "")
        
        print(f"\n💡 Generating suggestions for {len(issues)} issues...")
        
        if not issues:
            return {"suggestions": ["No issues found - workflow looks good!", "Consider adding more test coverage."]}
        
        # Group issues by type for better suggestions
        caching_issues = [i for i in issues if "caching" in i.get("issue", "").lower()]
        install_issues = [i for i in issues if "install" in i.get("issue", "").lower()]
        parallel_issues = [i for i in issues if "parallel" in i.get("issue", "").lower()]
        
        issues_text = "\n".join([
            f"- {i.get('workflow', 'unknown')}: {i.get('issue', 'N/A')}" 
            for i in issues[:15]  # Limit to 15 for prompt
        ])
        if len(issues) > 15:
            issues_text += f"\n... and {len(issues) - 15} more issues"
        
        prompt = f"""As an AI DevOps expert, suggest improvements for this GitHub Actions CI/CD setup.

Repository: {repo}

Issues found ({len(issues)} total):
- Caching issues: {len(caching_issues)}
- Repeated installs: {len(install_issues)}
- Parallelization: {len(parallel_issues)}

Details:
{issues_text}

Provide 3-5 specific, actionable bullet point suggestions. Each should start with an action verb.
Focus on the most impactful improvements that will reduce CI/CD costs and time.
"""

        llm = LLMClient()
        response = llm.generate(prompt)
        
        suggestions = [s.strip().lstrip("- ").lstrip("* ").lstrip("• ") 
                      for s in response.strip().split("\n") 
                      if s.strip() and len(s.strip()) > 10]
        
        print(f"✅ Generated {len(suggestions)} suggestions")
        return {"suggestions": suggestions}