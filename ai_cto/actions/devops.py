import yaml
from ai_cto.actions.base import Action
from ai_cto.llm import LLMClient


class AnalyzeWorkflows(Action):
    name: str = "analyze_workflows"
    description: str = "Analyze workflow YAML for CI/CD issues"

    def run(self, **kwargs) -> dict:
        issues = []
        workflows = kwargs.get("workflows", [])

        for workflow in workflows:
            content = workflow.get("content", "")
            workflow_name = workflow.get("name", "unknown")

            if not content:
                issues.append({
                    "workflow": workflow_name,
                    "issue": "Empty content",
                    "severity": "low",
                })
                continue

            try:
                data = yaml.safe_load(content)
            except Exception as error:
                issues.append({
                    "workflow": workflow_name,
                    "issue": f"Invalid YAML: {str(error)[:50]}",
                    "severity": "medium",
                })
                continue

            if not data:
                issues.append({
                    "workflow": workflow_name,
                    "issue": "Empty workflow",
                    "severity": "low",
                })
                continue

            jobs = data.get("jobs", {})
            if not jobs:
                triggers = data.get("on", {})
                if isinstance(triggers, dict) and "workflow_call" in triggers:
                    continue
                issues.append({
                    "workflow": workflow_name,
                    "issue": "No jobs defined",
                    "severity": "low",
                })
                continue

            has_cache = False
            for job in jobs.values() if isinstance(jobs, dict) else []:
                if not isinstance(job, dict):
                    continue

                for step in job.get("steps", []) or []:
                    if not isinstance(step, dict):
                        continue

                    uses = str(step.get("uses", "")).lower()
                    if "cache" in uses:
                        has_cache = True
                        break

                if has_cache:
                    break

            if not has_cache:
                issues.append({
                    "workflow": workflow_name,
                    "issue": "No caching configured",
                    "severity": "medium",
                })

            install_keywords = [
                "npm install",
                "npm ci",
                "pip install",
                "pip3 install",
                "yarn install",
                "bundle install",
                "go mod download",
                "cargo fetch",
                "poetry install",
            ]

            install_count = 0
            for job in jobs.values() if isinstance(jobs, dict) else []:
                if not isinstance(job, dict):
                    continue

                for step in job.get("steps", []) or []:
                    if not isinstance(step, dict):
                        continue

                    run_command = str(step.get("run", "")).lower()
                    if any(keyword in run_command for keyword in install_keywords):
                        install_count += 1

            if install_count > 1:
                issues.append({
                    "workflow": workflow_name,
                    "issue": f"Repeated installs ({install_count}x)",
                    "severity": "low",
                })

            if len(jobs) > 1:
                has_dependencies = False
                for job in jobs.values() if isinstance(jobs, dict) else []:
                    if isinstance(job, dict) and job.get("needs"):
                        has_dependencies = True
                        break

                if not has_dependencies:
                    issues.append({
                        "workflow": workflow_name,
                        "issue": "Jobs could run in parallel",
                        "severity": "low",
                    })

        return {"issues": issues}


class SuggestImprovements(Action):
    name: str = "suggest_improvements"
    description: str = "Use AI to generate CI/CD improvement suggestions"

    def _fallback_suggestions(self, issues: list[dict]) -> list[str]:
        if not issues:
            return [
                "Add branch protection and required status checks to keep changes safe.",
                "Expand automated test coverage so pull requests validate more of the delivery path.",
                "Document release and rollback steps to speed up incidents and onboarding.",
            ]

        suggestions: list[str] = []
        issues_text = " ".join(str(issue.get("issue", "")).lower() for issue in issues)

        if "caching" in issues_text:
            suggestions.append(
                "Add dependency and build caching so repeated workflow runs complete faster."
            )
        if "install" in issues_text:
            suggestions.append(
                "Consolidate repeated install steps into a shared setup job or reusable action."
            )
        if "parallel" in issues_text:
            suggestions.append(
                "Split independent jobs so tests, linting, and builds can run in parallel."
            )
        if "yaml" in issues_text or "empty workflow" in issues_text:
            suggestions.append(
                "Tighten workflow validation and keep YAML definitions small and well-scoped."
            )
        if "no jobs defined" in issues_text:
            suggestions.append(
                "Define explicit jobs with clear outputs so the pipeline is observable and maintainable."
            )

        if not suggestions:
            suggestions.extend([
                "Prioritize the highest-severity CI findings and address the slowest stages first.",
                "Standardize reusable workflow steps to reduce drift across repositories.",
                "Add lightweight notifications so failed runs are noticed quickly.",
            ])

        return suggestions[:5]

    def run(self, **kwargs) -> dict:
        issues = kwargs.get("issues", [])
        repo = kwargs.get("repo", "")

        if not issues:
            return {"suggestions": self._fallback_suggestions([])}

        caching_issues = [
            issue for issue in issues if "caching" in issue.get("issue", "").lower()
        ]
        install_issues = [
            issue for issue in issues if "install" in issue.get("issue", "").lower()
        ]
        parallel_issues = [
            issue for issue in issues if "parallel" in issue.get("issue", "").lower()
        ]

        issues_text = "\n".join([
            f"- {issue.get('workflow', 'unknown')}: {issue.get('issue', 'N/A')}"
            for issue in issues[:15]
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

        try:
            llm = LLMClient()
            response = llm.generate(prompt)
            suggestions = [
                line.strip().lstrip("- ").lstrip("* ").lstrip("• ")
                for line in response.strip().split("\n")
                if line.strip() and len(line.strip()) > 10
            ]
            if suggestions:
                return {"suggestions": suggestions[:5]}
        except Exception:
            pass

        return {"suggestions": self._fallback_suggestions(issues)}
