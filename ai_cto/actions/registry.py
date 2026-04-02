from ai_cto.actions.base import Action, ActionRegistry
from ai_cto.actions.github import FetchWorkflows, CommentOnPR
from ai_cto.actions.devops import AnalyzeWorkflows, SuggestImprovements
from ai_cto.actions.knowledge_graph import AnalyzeKnowledgeGraph
from ai_cto.actions.tools import (
    WebSearch, CodeExplain, GeneralChat, WriteCode, 
    DebugCode, SummarizeText, TranslateText
)

ActionRegistry.register(FetchWorkflows)
ActionRegistry.register(AnalyzeWorkflows)
ActionRegistry.register(SuggestImprovements)
ActionRegistry.register(AnalyzeKnowledgeGraph)
ActionRegistry.register(CommentOnPR)
ActionRegistry.register(WebSearch)
ActionRegistry.register(CodeExplain)
ActionRegistry.register(GeneralChat)
ActionRegistry.register(WriteCode)
ActionRegistry.register(DebugCode)
ActionRegistry.register(SummarizeText)
ActionRegistry.register(TranslateText)

__all__ = ["ActionRegistry", "Action"]
