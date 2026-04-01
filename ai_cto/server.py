import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Iterator, Dict
import json
from openai.types.chat import ChatCompletionMessageParam
from typing import cast

from ai_cto.llm import LLMClient
from ai_cto.actions.github import FetchRepoData, FetchWorkflows
from ai_cto.actions.devops import AnalyzeWorkflows, SuggestImprovements

app = FastAPI(title="AI CTO Server")

llm = LLMClient()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    system: Optional[str] = None
    temperature: float = 0.5
    max_tokens: int = 4096


class AnalyzeRequest(BaseModel):
    repo: str
    include_readme: bool = True
    include_issues: bool = True
    include_workflows: bool = True


class FullAnalyzeRequest(BaseModel):
    repo: str


class ChatResponse(BaseModel):
    message: str


def build_messages(chat_request: ChatRequest) -> List[Dict[str, str]]:
    messages = []
    if chat_request.system:
        messages.append({"role": "system", "content": chat_request.system})
    for msg in chat_request.messages:
        messages.append({"role": msg.role, "content": msg.content})
    return messages


@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    messages = build_messages(request)
    typed_messages = cast(list[ChatCompletionMessageParam], messages)

    def generate() -> Iterator[str]:
        try:
            for chunk in llm.stream_chat(
                typed_messages, request.temperature, request.max_tokens
            ):
                yield f"data: {json.dumps({'choices': [{'delta': {'content': chunk}}]})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/chat")
async def chat(request: ChatRequest):
    messages = build_messages(request)
    typed_messages = cast(list[ChatCompletionMessageParam], messages)
    try:
        response = llm.chat(typed_messages, request.temperature, request.max_tokens)
        return {"message": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        # Fetch repository data
        fetcher = FetchRepoData(repo=request.repo)
        repo_data = fetcher.run()

        # Build analysis prompt
        analysis_parts = []

        # Metadata summary
        if repo_data.get("metadata"):
            meta = repo_data["metadata"]
            analysis_parts.append(f"""## Repository Overview
- **Name**: {meta.get("full_name", request.repo)}
- **Description**: {meta.get("description", "No description")}
- **Language**: {meta.get("language", "Not specified")}
- **Stars**: {meta.get("stargazers_count", 0)}
- **Forks**: {meta.get("forks_count", 0)}
- **Open Issues**: {meta.get("open_issues_count", 0)}
- **Default Branch**: {meta.get("default_branch", "main")}
- **License**: {meta.get("license", "None")}
- **Topics**: {", ".join(meta.get("topics", [])[:10]) if meta.get("topics") else "None"}
""")

        # README summary
        if request.include_readme and repo_data.get("readme"):
            readme = repo_data["readme"]
            readme_preview = readme[:2000] + "..." if len(readme) > 2000 else readme
            analysis_parts.append(f"""## README.md
```
{readme_preview}
```
""")

        # Issues summary
        if request.include_issues and repo_data.get("issues"):
            issues = repo_data["issues"]
            issues_text = "\n".join(
                [
                    f"- #{i['number']}: {i['title']} ({', '.join(i['labels']) if i['labels'] else 'no labels'})"
                    for i in issues[:10]
                ]
            )
            analysis_parts.append(f"""## Open Issues ({len(issues)} total)
{issues_text}
""")

        # Workflows summary
        if request.include_workflows and repo_data.get("workflows"):
            workflows = repo_data["workflows"]
            workflows_text = "\n".join(
                [f"- {w['name']} ({w['path']})" for w in workflows]
            )
            analysis_parts.append(f"""## CI/CD Workflows ({len(workflows)} total)
{workflows_text}
""")

        # Languages
        if repo_data.get("languages"):
            total_bytes = sum(repo_data["languages"].values())
            lang_text = "\n".join(
                [
                    f"- {lang}: {round(bytes / total_bytes * 100, 1)}%"
                    for lang, bytes in sorted(
                        repo_data["languages"].items(), key=lambda x: x[1], reverse=True
                    )[:10]
                ]
            )
            analysis_parts.append(f"""## Programming Languages
{lang_text}
""")

        # Generate AI insights
        analysis_content = "\n".join(analysis_parts)

        prompt = f"""You are an expert software engineer and CTO analyzing a GitHub repository.

Analyze the following repository data and provide:
1. A brief summary of the project
2. Key strengths and potential concerns
3. Recommendations for improvement

Repository Data:
{analysis_content}

Provide your analysis in a clear, structured format with markdown headers."""

        response = llm.chat(
            [{"role": "user", "content": prompt}], temperature=0.5, max_tokens=2048
        )

        return {
            "success": True,
            "repo": request.repo,
            "data": {
                "metadata": repo_data.get("metadata", {}),
                "readme": repo_data.get("readme"),
                "readme_truncated": repo_data.get("readme", "")[:1000] + "..."
                if repo_data.get("readme") and len(repo_data.get("readme", "")) > 1000
                else repo_data.get("readme"),
                "issues": repo_data.get("issues", [])[:15],
                "issues_count": len(repo_data.get("issues", [])),
                "open_issues_count": repo_data.get("open_issues_count", 0),
                "workflows": repo_data.get("workflows", []),
                "languages": repo_data.get("languages", {}),
                "languages_total": sum(repo_data.get("languages", {}).values()),
            },
            "analysis": response,
            "error": repo_data.get("error"),
        }

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-full")
async def analyze_full(request: FullAnalyzeRequest):
    """
    Full analysis like the CLI - fetches workflows, analyzes them, and generates suggestions.
    """
    try:
        result = {
            "success": True,
            "repo": request.repo,
            "history": [],
            "workflows": [],
            "ci_issues": [],
            "suggestions": [],
            "error": None,
        }

        # Step 1: Fetch workflows
        print(f"Analyzing CI/CD workflows for {request.repo}")
        print("=" * 50)

        fetch_wf = FetchWorkflows(repo=request.repo)
        wf_result = fetch_wf.run()
        workflows = wf_result.get("workflows", [])
        print(f"Found {len(workflows)} workflow files")

        result["workflows"] = workflows

        # Step 2: Analyze workflows for issues
        print(f"\nAnalyzing {len(workflows)} workflows...")

        analyze_wf = AnalyzeWorkflows()
        issues_result = analyze_wf.run(workflows=workflows)
        issues = issues_result.get("issues", [])
        print(f"Found {len(issues)} issues")

        result["ci_issues"] = issues

        # Step 3: Generate suggestions
        print(f"\nGenerating suggestions for {len(issues)} issues...")

        suggest = SuggestImprovements()
        suggestions_result = suggest.run(issues=issues, repo=request.repo)
        suggestions = suggestions_result.get("suggestions", [])
        print(f"Generated {len(suggestions)} suggestions")

        result["suggestions"] = suggestions

        # Build history like CLI does
        result["history"] = [
            {
                "step": 1,
                "action": "fetch_workflows",
                "input": {"repo": request.repo},
                "result": {
                    "repo": request.repo,
                    "workflows": [
                        {"name": w["name"], "path": w["path"]} for w in workflows
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

        return result

    except Exception as e:
        import traceback

        traceback.print_exc()
        return {
            "success": False,
            "repo": request.repo,
            "history": [],
            "workflows": [],
            "ci_issues": [],
            "suggestions": [],
            "error": str(e),
        }


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8081)
