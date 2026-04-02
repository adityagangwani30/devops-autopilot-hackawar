from ai_cto.actions.base import Action
from ai_cto.knowledge_graph_tools import analyze_knowledge_graph


class AnalyzeKnowledgeGraph(Action):
    name: str = "analyze_knowledge_graph"
    description: str = (
        "Analyze a local knowledge graph for repositories, workflows, issues, and suggestions"
    )

    def run(self, **kwargs) -> dict:
        question = kwargs.get("question", "")
        knowledge_graph = kwargs.get("knowledge_graph") or {}
        return analyze_knowledge_graph(question=question, knowledge_graph=knowledge_graph)
