from __future__ import annotations

from collections import defaultdict
import re
from typing import Any, Dict, Iterable, List


STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "at",
    "be",
    "by",
    "for",
    "from",
    "give",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "our",
    "please",
    "show",
    "should",
    "tell",
    "that",
    "the",
    "their",
    "them",
    "these",
    "this",
    "those",
    "to",
    "us",
    "what",
    "which",
    "with",
    "you",
    "your",
}


def _as_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def _as_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, dict):
        return " ".join(normalize_text(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(normalize_text(item) for item in value)
    return str(value)


def tokenize_question(question: str) -> List[str]:
    tokens = re.findall(r"[a-zA-Z0-9_.-]+", question.lower())
    return [token for token in tokens if len(token) > 2 and token not in STOP_WORDS]


def get_last_user_message(messages: List[Dict[str, str]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return message.get("content", "")
    return ""


def _match_score(question_terms: List[str], *texts: str) -> int:
    haystack = " ".join(texts).lower()
    return sum(1 for term in question_terms if term in haystack)


def _compact_text(value: str, limit: int = 220) -> str:
    collapsed = re.sub(r"\s+", " ", value).strip()
    if len(collapsed) <= limit:
        return collapsed
    return collapsed[: limit - 3].rstrip() + "..."


def _extract_issue_summary(node: Dict[str, Any]) -> str:
    properties = _as_dict(node.get("properties"))
    issue = properties.get("issue")
    if isinstance(issue, dict):
        title = normalize_text(issue.get("title") or issue.get("issue"))
        severity = normalize_text(issue.get("severity"))
        if severity:
            return _compact_text(f"{title} ({severity})")
        return _compact_text(title)
    if isinstance(issue, str):
        return _compact_text(issue)
    return _compact_text(normalize_text(node.get("label")))


def _extract_suggestion_summary(node: Dict[str, Any]) -> str:
    properties = _as_dict(node.get("properties"))
    suggestion = properties.get("suggestion")
    if isinstance(suggestion, str) and suggestion.strip():
        return _compact_text(suggestion)
    return _compact_text(normalize_text(node.get("label")))


def _top_languages(language_nodes: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    totals: Dict[str, int] = defaultdict(int)
    for node in language_nodes:
        label = normalize_text(node.get("label"))
        bytes_value = _as_dict(node.get("properties")).get("bytes")
        totals[label] += int(bytes_value) if isinstance(bytes_value, int) else 0

    ranked = sorted(totals.items(), key=lambda item: item[1], reverse=True)
    return [
        {"language": language, "bytes": total}
        for language, total in ranked[:5]
        if language
    ]


def analyze_knowledge_graph(question: str, knowledge_graph: Dict[str, Any]) -> Dict[str, Any]:
    nodes = _as_list(knowledge_graph.get("nodes"))
    edges = _as_list(knowledge_graph.get("edges"))
    analyses = _as_list(knowledge_graph.get("analyses"))
    stats = _as_dict(knowledge_graph.get("stats"))
    question_terms = tokenize_question(question)

    if not nodes and not analyses:
        return {
            "question": question,
            "summary": "No knowledge graph data is available yet for this user.",
            "stats": {
                "analyzedRepositories": 0,
                "failedRepositories": 0,
                "graphNodes": 0,
                "graphEdges": 0,
            },
            "repositories": [],
            "matchingNodes": [],
            "ciIssues": [],
            "suggestions": [],
            "topLanguages": [],
            "recommendedActions": [
                "Build the knowledge graph first so answers can use repository analysis.",
                "Run repository analysis on the repositories page if nothing has been analyzed yet.",
            ],
        }

    repository_nodes = [node for node in nodes if node.get("type") == "repository"]
    language_nodes = [node for node in nodes if node.get("type") == "language"]
    workflow_nodes = [node for node in nodes if node.get("type") == "workflow"]
    ci_issue_nodes = [node for node in nodes if node.get("type") == "ci_issue"]
    suggestion_nodes = [node for node in nodes if node.get("type") == "suggestion"]

    repo_index: Dict[str, Dict[str, Any]] = {}
    for analysis in analyses:
        repo_full_name = normalize_text(analysis.get("repoFullName"))
        if not repo_full_name:
            continue
        repo_index[repo_full_name] = {
            "repoFullName": repo_full_name,
            "repoName": normalize_text(analysis.get("repoName")) or repo_full_name.split("/")[-1],
            "status": normalize_text(analysis.get("status")) or "unknown",
            "summary": normalize_text(analysis.get("summary")),
            "analyzedAt": normalize_text(analysis.get("analyzedAt")),
            "lastError": normalize_text(analysis.get("lastError")),
            "score": 0,
        }

    for node in repository_nodes:
        repo_full_name = normalize_text(_as_dict(node.get("properties")).get("fullName") or node.get("repoFullName"))
        if not repo_full_name:
            continue
        entry = repo_index.setdefault(
            repo_full_name,
            {
                "repoFullName": repo_full_name,
                "repoName": normalize_text(node.get("label")) or repo_full_name.split("/")[-1],
                "status": "completed",
                "summary": normalize_text(_as_dict(node.get("properties")).get("summary")),
                "analyzedAt": normalize_text(_as_dict(node.get("properties")).get("analyzedAt")),
                "lastError": "",
                "score": 0,
            },
        )
        entry["summary"] = entry["summary"] or normalize_text(_as_dict(node.get("properties")).get("summary"))

    for repo_entry in repo_index.values():
        repo_entry["score"] = _match_score(
            question_terms,
            repo_entry["repoFullName"],
            repo_entry["repoName"],
            repo_entry["summary"],
            repo_entry["lastError"],
        )

    repositories = sorted(
        repo_index.values(),
        key=lambda item: (item["score"], item["status"] == "failed", item["repoFullName"]),
        reverse=True,
    )

    if question_terms:
        repositories = [
            repo for repo in repositories if repo["score"] > 0 or repo["status"] == "failed"
        ] or repositories

    repositories = repositories[:5]

    matching_nodes = []
    for node in nodes:
        label = normalize_text(node.get("label"))
        repo_full_name = normalize_text(node.get("repoFullName"))
        properties_text = normalize_text(node.get("properties"))
        score = _match_score(question_terms, label, repo_full_name, properties_text)
        if score <= 0 and question_terms:
            continue
        matching_nodes.append({
            "label": label,
            "type": normalize_text(node.get("type")),
            "repoFullName": repo_full_name,
            "score": score,
        })

    matching_nodes = sorted(
        matching_nodes,
        key=lambda item: (item["score"], item["type"], item["label"]),
        reverse=True,
    )[:8]

    ci_issues = []
    for node in ci_issue_nodes:
        repo_full_name = normalize_text(node.get("repoFullName"))
        summary = _extract_issue_summary(node)
        score = _match_score(question_terms, repo_full_name, summary)
        if question_terms and score <= 0:
            relevant_repo_names = {repo["repoFullName"] for repo in repositories}
            if repo_full_name not in relevant_repo_names:
                continue
        ci_issues.append({
            "repoFullName": repo_full_name,
            "summary": summary,
            "score": score,
        })

    ci_issues = sorted(ci_issues, key=lambda item: (item["score"], item["repoFullName"]), reverse=True)[:6]

    suggestions = []
    for node in suggestion_nodes:
        repo_full_name = normalize_text(node.get("repoFullName"))
        summary = _extract_suggestion_summary(node)
        score = _match_score(question_terms, repo_full_name, summary)
        if question_terms and score <= 0:
            relevant_repo_names = {repo["repoFullName"] for repo in repositories}
            if repo_full_name not in relevant_repo_names:
                continue
        suggestions.append({
            "repoFullName": repo_full_name,
            "summary": summary,
            "score": score,
        })

    suggestions = sorted(
        suggestions,
        key=lambda item: (item["score"], item["repoFullName"]),
        reverse=True,
    )[:6]

    top_languages = _top_languages(language_nodes)
    failed_repositories = [
        repo["repoFullName"] for repo in repo_index.values() if repo.get("status") == "failed"
    ]

    recommended_actions: List[str] = []
    if failed_repositories:
        preview = ", ".join(failed_repositories[:3])
        recommended_actions.append(
            f"Re-run or inspect failed repository analyses for {preview}."
        )
    if ci_issues:
        repo_preview = ", ".join(sorted({issue["repoFullName"] for issue in ci_issues})[:3])
        recommended_actions.append(
            f"Prioritize CI and workflow cleanup in {repo_preview}."
        )
    if not workflow_nodes:
        recommended_actions.append(
            "Add GitHub Actions workflows so the knowledge graph can track delivery automation."
        )
    if suggestions:
        recommended_actions.append(
            "Turn the saved improvement suggestions into tracked backlog items."
        )
    if not recommended_actions:
        recommended_actions.append(
            "The graph looks healthy overall; focus next on higher test coverage and release visibility."
        )

    analyzed_repositories = int(
        stats.get("analyzedRepositories") if isinstance(stats.get("analyzedRepositories"), int) else len(
            [repo for repo in repo_index.values() if repo.get("status") == "completed"]
        )
    )
    failed_repositories_count = int(
        stats.get("failedRepositories") if isinstance(stats.get("failedRepositories"), int) else len(failed_repositories)
    )
    graph_nodes = int(stats.get("graphNodes") if isinstance(stats.get("graphNodes"), int) else len(nodes))
    graph_edges = int(stats.get("graphEdges") if isinstance(stats.get("graphEdges"), int) else len(edges))

    summary = (
        f"The knowledge graph currently covers {analyzed_repositories} analyzed repositories, "
        f"{graph_nodes} nodes, and {graph_edges} edges. "
        f"I found {len(ci_issue_nodes)} CI issue nodes, {len(suggestion_nodes)} suggestion nodes, "
        f"and {failed_repositories_count} failed analyses."
    )

    return {
        "question": question,
        "summary": summary,
        "stats": {
            "analyzedRepositories": analyzed_repositories,
            "failedRepositories": failed_repositories_count,
            "graphNodes": graph_nodes,
            "graphEdges": graph_edges,
        },
        "repositories": repositories,
        "matchingNodes": matching_nodes,
        "ciIssues": ci_issues,
        "suggestions": suggestions,
        "topLanguages": top_languages,
        "recommendedActions": recommended_actions[:5],
    }


def format_tool_result_for_prompt(tool_result: Dict[str, Any]) -> str:
    repositories = _as_list(tool_result.get("repositories"))
    ci_issues = _as_list(tool_result.get("ciIssues"))
    suggestions = _as_list(tool_result.get("suggestions"))
    recommended_actions = _as_list(tool_result.get("recommendedActions"))
    top_languages = _as_list(tool_result.get("topLanguages"))

    lines = [
        f"Question: {normalize_text(tool_result.get('question'))}",
        f"Summary: {normalize_text(tool_result.get('summary'))}",
        f"Stats: {tool_result.get('stats')}",
    ]

    if repositories:
        lines.append("Relevant repositories:")
        for repo in repositories[:5]:
            lines.append(
                f"- {normalize_text(repo.get('repoFullName'))}: "
                f"status={normalize_text(repo.get('status'))}; "
                f"summary={_compact_text(normalize_text(repo.get('summary')), 180)}"
            )

    if ci_issues:
        lines.append("CI issues:")
        for issue in ci_issues[:5]:
            lines.append(
                f"- {normalize_text(issue.get('repoFullName'))}: "
                f"{normalize_text(issue.get('summary'))}"
            )

    if suggestions:
        lines.append("Saved suggestions:")
        for suggestion in suggestions[:5]:
            lines.append(
                f"- {normalize_text(suggestion.get('repoFullName'))}: "
                f"{normalize_text(suggestion.get('summary'))}"
            )

    if top_languages:
        lines.append("Top languages:")
        for language in top_languages[:5]:
            lines.append(
                f"- {normalize_text(language.get('language'))}: "
                f"{normalize_text(language.get('bytes'))} bytes"
            )

    if recommended_actions:
        lines.append("Recommended actions:")
        for action in recommended_actions[:5]:
            lines.append(f"- {normalize_text(action)}")

    return "\n".join(lines)


def fallback_knowledge_graph_answer(question: str, tool_result: Dict[str, Any]) -> str:
    repositories = _as_list(tool_result.get("repositories"))
    ci_issues = _as_list(tool_result.get("ciIssues"))
    suggestions = _as_list(tool_result.get("suggestions"))
    recommended_actions = _as_list(tool_result.get("recommendedActions"))
    stats = _as_dict(tool_result.get("stats"))

    if not repositories and not ci_issues and not suggestions:
        return (
            "I do not have any saved repository knowledge graph data yet. "
            "Build the knowledge graph first or run repository analysis so I can answer questions with project context."
        )

    lines = [
        normalize_text(tool_result.get("summary")),
        "",
    ]

    if repositories:
        lines.append("Most relevant repositories:")
        for repo in repositories[:4]:
            repo_summary = normalize_text(repo.get("summary")) or "No saved summary yet."
            lines.append(
                f"- {normalize_text(repo.get('repoFullName'))}: "
                f"{_compact_text(repo_summary, 180)}"
            )
        lines.append("")

    if ci_issues:
        lines.append("Notable CI or workflow issues:")
        for issue in ci_issues[:4]:
            lines.append(
                f"- {normalize_text(issue.get('repoFullName'))}: "
                f"{normalize_text(issue.get('summary'))}"
            )
        lines.append("")

    if suggestions:
        lines.append("Saved recommendations from analysis:")
        for suggestion in suggestions[:4]:
            lines.append(
                f"- {normalize_text(suggestion.get('repoFullName'))}: "
                f"{normalize_text(suggestion.get('summary'))}"
            )
        lines.append("")

    if recommended_actions:
        lines.append("What I would do next:")
        for action in recommended_actions[:4]:
            lines.append(f"- {normalize_text(action)}")
        lines.append("")

    lines.append(
        "Grounding: "
        f"{normalize_text(stats.get('analyzedRepositories'))} analyzed repos, "
        f"{normalize_text(stats.get('graphNodes'))} nodes, "
        f"{normalize_text(stats.get('graphEdges'))} edges."
    )

    return "\n".join(line for line in lines if line is not None).strip()
