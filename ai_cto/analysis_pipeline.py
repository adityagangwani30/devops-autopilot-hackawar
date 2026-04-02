import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from typing import Any, Dict, Optional

from ai_cto.actions.devops import AnalyzeWorkflows, SuggestImprovements
from ai_cto.actions.github import FetchRepoData, FetchWorkflows

try:
    from ai_cto.llm import LLMClient
except Exception:
    LLMClient = None  # type: ignore[assignment]


_llm_client: Optional["LLMClient"] = None
_llm_attempted = False


def get_llm_client():
    global _llm_client, _llm_attempted
    if _llm_attempted:
        return _llm_client

    _llm_attempted = True
    if LLMClient is None:
        return None

    try:
        _llm_client = LLMClient()
    except Exception:
        _llm_client = None

    return _llm_client


def summarize_repository(repo: str, repo_data: Dict[str, Any]) -> str:
    metadata = repo_data.get("metadata", {})
    issues = repo_data.get("issues", [])
    workflows = repo_data.get("workflows", [])
    languages = repo_data.get("languages", {})
    structure = repo_data.get("structure", {})
    readme = repo_data.get("readme") or ""

    language_preview = ", ".join(list(languages.keys())[:5]) or "Unknown"
    workflow_preview = ", ".join(
        workflow.get("name", workflow.get("path", "workflow")) for workflow in workflows[:5]
    ) or "No workflows detected"
    structure_preview = ", ".join(structure.get("top_level_directories", [])[:8]) or "No top-level directories detected"
    important_files_preview = ", ".join(structure.get("important_files", [])[:8]) or "No notable root files detected"
    sample_paths_preview = ", ".join(structure.get("sample_paths", [])[:12]) or "No sample paths detected"

    prompt = f"""You are an expert software engineer and CTO analyzing a GitHub repository.

Analyze the following repository data and provide:
1. A brief summary of the project
2. Key strengths and potential concerns
3. Recommendations for improvement

Repository: {repo}
Description: {metadata.get("description") or "No description"}
Primary language: {metadata.get("language") or "Unknown"}
Languages: {language_preview}
Open issues: {len(issues)}
Workflows: {workflow_preview}
Top-level directories: {structure_preview}
Important root files: {important_files_preview}
Project structure sample: {sample_paths_preview}
README preview:
{readme[:1800]}

Provide your analysis in markdown with short section headers.
"""

    llm = get_llm_client()
    if llm is not None:
        try:
            return llm.chat(
                [{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=1800,
            )
        except Exception:
            pass

    concerns = []
    if not workflows:
        concerns.append("No CI/CD workflows were detected.")
    if len(issues) > 10:
        concerns.append("The repository has a relatively high number of open issues.")
    if not readme:
        concerns.append("README content could not be fetched.")
    if not structure.get("top_level_directories") and not structure.get("sample_paths"):
        concerns.append("Repository structure could not be inferred beyond metadata.")

    strengths = []
    if workflows:
        strengths.append(f"{len(workflows)} workflow file(s) already exist.")
    if metadata.get("language"):
        strengths.append(f"Primary language is {metadata['language']}.")
    if structure.get("top_level_directories"):
        strengths.append(
            "Top-level directories detected: "
            + ", ".join(structure["top_level_directories"][:5])
        )
    if not strengths:
        strengths.append("Repository metadata was fetched successfully.")

    recommendations = [
        "Review workflow coverage and add missing validation steps.",
        "Track the highest-priority open issues and clean up stale tickets.",
        "Keep repository documentation and onboarding notes up to date.",
    ]

    return "\n".join(
        [
            "## Summary",
            f"{repo} is an actively tracked repository with {len(issues)} open issue(s) and {len(workflows)} workflow file(s).",
            "",
            "## Strengths",
            *[f"- {item}" for item in strengths],
            "",
            "## Concerns",
            *([f"- {item}" for item in concerns] or ["- No major concerns were detected from the fetched metadata."]),
            "",
            "## Recommendations",
            *[f"- {item}" for item in recommendations],
        ]
    )


def run_repository_analysis(
    repo: str,
    github_token: Optional[str] = None,
    include_readme: bool = True,
    include_issues: bool = True,
    include_workflows: bool = True,
) -> Dict[str, Any]:
    fetcher = FetchRepoData(repo=repo, github_token=github_token)
    repo_data = fetcher.run(repo=repo, github_token=github_token)

    analysis = summarize_repository(repo, repo_data)

    return {
        "success": True,
        "repo": repo,
        "data": {
            "metadata": repo_data.get("metadata", {}),
            "readme": repo_data.get("readme") if include_readme else None,
            "readme_truncated": repo_data.get("readme", "")[:1000] + "..."
            if include_readme
            and repo_data.get("readme")
            and len(repo_data.get("readme", "")) > 1000
            else repo_data.get("readme") if include_readme else None,
            "issues": repo_data.get("issues", [])[:15] if include_issues else [],
            "issues_count": len(repo_data.get("issues", [])) if include_issues else 0,
            "open_issues_count": repo_data.get("open_issues_count", 0) if include_issues else 0,
            "workflows": repo_data.get("workflows", []) if include_workflows else [],
            "languages": repo_data.get("languages", {}),
            "languages_total": sum(repo_data.get("languages", {}).values()),
            "dependencies": repo_data.get("dependencies", {}),
            "structure": repo_data.get("structure", {}),
        },
        "analysis": analysis,
        "error": repo_data.get("error"),
    }


def run_full_analysis(repo: str, github_token: Optional[str] = None) -> Dict[str, Any]:
    result = {
        "success": True,
        "repo": repo,
        "history": [],
        "workflows": [],
        "ci_issues": [],
        "suggestions": [],
        "error": None,
    }

    fetch_wf = FetchWorkflows(repo=repo, github_token=github_token)
    wf_result = fetch_wf.run(repo=repo, github_token=github_token)
    workflows = wf_result.get("workflows", [])
    result["workflows"] = workflows

    analyze_wf = AnalyzeWorkflows()
    issues_result = analyze_wf.run(workflows=workflows)
    issues = issues_result.get("issues", [])
    result["ci_issues"] = issues

    suggest = SuggestImprovements()
    suggestions_result = suggest.run(issues=issues, repo=repo)
    suggestions = suggestions_result.get("suggestions", [])
    result["suggestions"] = suggestions

    result["history"] = [
        {
            "step": 1,
            "action": "fetch_workflows",
            "input": {"repo": repo},
            "result": {
                "repo": repo,
                "workflows": [
                    {"name": workflow["name"], "path": workflow["path"]}
                    for workflow in workflows
                ],
            },
        },
        {
            "step": 2,
            "action": "analyze_workflows",
            "input": {},
            "result": {"issues": issues},
        },
        {
            "step": 3,
            "action": "suggest_improvements",
            "input": {},
            "result": {"suggestions": suggestions},
        },
    ]

    if wf_result.get("error"):
        result["error"] = wf_result["error"]

    return result


def run_combined_analysis(repo: str, github_token: Optional[str] = None) -> Dict[str, Any]:
    repository_analysis = run_repository_analysis(repo=repo, github_token=github_token)
    workflow_analysis = run_full_analysis(repo=repo, github_token=github_token)

    return {
        "success": bool(repository_analysis.get("success")) and bool(workflow_analysis.get("success")),
        "repo": repo,
        "data": repository_analysis.get("data", {}),
        "analysis": repository_analysis.get("analysis"),
        "workflows": workflow_analysis.get("workflows", []),
        "ci_issues": workflow_analysis.get("ci_issues", []),
        "suggestions": workflow_analysis.get("suggestions", []),
        "history": workflow_analysis.get("history", []),
        "error": repository_analysis.get("error") or workflow_analysis.get("error"),
    }
