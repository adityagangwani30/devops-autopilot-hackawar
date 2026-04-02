import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import json
from typing import Any, Dict, Iterator, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ai_cto.analysis_pipeline import (
    run_combined_analysis,
    run_full_analysis,
    run_repository_analysis,
)
from ai_cto.chat_service import generate_chat_reply, stream_chat_reply


app = FastAPI(title="AI CTO Server")


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    system: Optional[str] = None
    temperature: float = 0.5
    max_tokens: int = 4096
    knowledge_graph: Optional[Dict[str, Any]] = None
    use_knowledge_graph_tool: bool = True


class AnalyzeRequest(BaseModel):
    repo: str
    include_readme: bool = True
    include_issues: bool = True
    include_workflows: bool = True
    github_token: Optional[str] = None


class FullAnalyzeRequest(BaseModel):
    repo: str
    github_token: Optional[str] = None


def serialize_messages(chat_request: ChatRequest) -> List[Dict[str, str]]:
    return [
        {"role": message.role, "content": message.content}
        for message in chat_request.messages
    ]


@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    messages = serialize_messages(request)

    def generate() -> Iterator[str]:
        try:
            for chunk in stream_chat_reply(
                messages=messages,
                system=request.system,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                knowledge_graph=request.knowledge_graph,
                use_knowledge_graph_tool=request.use_knowledge_graph_tool,
            ):
                yield f"data: {json.dumps({'choices': [{'delta': {'content': chunk}}]})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as error:
            yield f"data: {json.dumps({'error': str(error)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        return generate_chat_reply(
            messages=serialize_messages(request),
            system=request.system,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            knowledge_graph=request.knowledge_graph,
            use_knowledge_graph_tool=request.use_knowledge_graph_tool,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/chat/knowledge-graph")
async def chat_with_knowledge_graph(request: ChatRequest):
    try:
        return generate_chat_reply(
            messages=serialize_messages(request),
            system=request.system,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            knowledge_graph=request.knowledge_graph,
            use_knowledge_graph_tool=True,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        return run_repository_analysis(
            repo=request.repo,
            github_token=request.github_token,
            include_readme=request.include_readme,
            include_issues=request.include_issues,
            include_workflows=request.include_workflows,
        )
    except Exception as error:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/analyze-full")
async def analyze_full(request: FullAnalyzeRequest):
    try:
        return run_full_analysis(
            repo=request.repo,
            github_token=request.github_token,
        )
    except Exception as error:
        import traceback

        traceback.print_exc()
        return {
            "success": False,
            "repo": request.repo,
            "history": [],
            "workflows": [],
            "ci_issues": [],
            "suggestions": [],
            "error": str(error),
        }


@app.post("/analyze-pipeline")
async def analyze_pipeline(request: FullAnalyzeRequest):
    try:
        return run_combined_analysis(
            repo=request.repo,
            github_token=request.github_token,
        )
    except Exception as error:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8081)
