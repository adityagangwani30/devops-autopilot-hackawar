from __future__ import annotations

from typing import Any, Dict, Iterator, List, Optional, cast

from openai.types.chat import ChatCompletionMessageParam

from ai_cto.actions.knowledge_graph import AnalyzeKnowledgeGraph
from ai_cto.knowledge_graph_tools import (
    fallback_knowledge_graph_answer,
    format_tool_result_for_prompt,
    get_last_user_message,
)

try:
    from ai_cto.llm import LLMClient
except Exception:
    LLMClient = None  # type: ignore[assignment]


_llm_client: Optional["LLMClient"] = None
_llm_attempted = False


def get_llm_client() -> Optional["LLMClient"]:
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


def prepare_chat_messages(
    messages: List[Dict[str, str]],
    system: Optional[str] = None,
    knowledge_graph: Optional[Dict[str, Any]] = None,
    use_knowledge_graph_tool: bool = True,
) -> tuple[List[Dict[str, str]], Optional[Dict[str, Any]], str]:
    prepared_messages: List[Dict[str, str]] = []
    question = get_last_user_message(messages)
    tool_result: Optional[Dict[str, Any]] = None

    if system:
        prepared_messages.append({"role": "system", "content": system})

    if use_knowledge_graph_tool:
        tool = AnalyzeKnowledgeGraph()
        tool_result = tool.run(question=question, knowledge_graph=knowledge_graph or {})
        prepared_messages.append({
            "role": "system",
            "content": (
                "You are answering with knowledge graph grounding from the user's repositories. "
                "Treat the following tool output as the source of truth for repository, workflow, issue, "
                "and recommendation questions.\n\n"
                f"Tool `analyze_knowledge_graph` output:\n{format_tool_result_for_prompt(tool_result)}"
            ),
        })

    prepared_messages.extend(messages)
    return prepared_messages, tool_result, question


def generate_chat_reply(
    messages: List[Dict[str, str]],
    system: Optional[str] = None,
    temperature: float = 0.5,
    max_tokens: int = 4096,
    knowledge_graph: Optional[Dict[str, Any]] = None,
    use_knowledge_graph_tool: bool = True,
) -> Dict[str, Any]:
    prepared_messages, tool_result, question = prepare_chat_messages(
        messages=messages,
        system=system,
        knowledge_graph=knowledge_graph,
        use_knowledge_graph_tool=use_knowledge_graph_tool,
    )

    llm = get_llm_client()
    if llm is not None:
        try:
            typed_messages = cast(List[ChatCompletionMessageParam], prepared_messages)
            reply = llm.chat(typed_messages, temperature, max_tokens)
            return {
                "message": reply,
                "tool_result": tool_result,
                "used_tool": bool(tool_result),
                "fallback": False,
            }
        except Exception:
            pass

    return {
        "message": fallback_knowledge_graph_answer(question, tool_result or {}),
        "tool_result": tool_result,
        "used_tool": bool(tool_result),
        "fallback": True,
    }


def stream_chat_reply(
    messages: List[Dict[str, str]],
    system: Optional[str] = None,
    temperature: float = 0.5,
    max_tokens: int = 4096,
    knowledge_graph: Optional[Dict[str, Any]] = None,
    use_knowledge_graph_tool: bool = True,
) -> Iterator[str]:
    prepared_messages, tool_result, question = prepare_chat_messages(
        messages=messages,
        system=system,
        knowledge_graph=knowledge_graph,
        use_knowledge_graph_tool=use_knowledge_graph_tool,
    )

    llm = get_llm_client()
    if llm is not None:
        try:
            typed_messages = cast(List[ChatCompletionMessageParam], prepared_messages)
            for chunk in llm.stream_chat(typed_messages, temperature, max_tokens):
                yield chunk
            return
        except Exception:
            pass

    yield fallback_knowledge_graph_answer(question, tool_result or {})
