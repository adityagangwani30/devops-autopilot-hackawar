from typing import Optional
from ai_cto.llm import LLMClient


class PlannerOutput:
    def __init__(self, action: str, input: dict, done: bool = False):
        self.action = action
        self.input = input
        self.done = done


class Planner:
    def __init__(self):
        self.llm = LLMClient()
    
    def decide_action_only(self, goal: str, available_actions: dict, history: list[dict]) -> PlannerOutput:
        history_text = "\n".join([
            f"- Step {i+1}: {h.get('action', '')}"
            for i, h in enumerate(history)
        ])
        
        actions_text = "\n".join([
            f"- {name}: {info['description']}"
            for name, info in available_actions.items()
        ])
        
        prompt = f"""You are an AI assistant. Choose the best action to respond to the user's request.

User request: {goal}

Available actions:
{actions_text}

Guidelines:
- For GitHub analysis: use "fetch_workflows" to fetch workflows
- For analyzing workflows: use "analyze_workflows" 
- For generating suggestions: use "suggest_improvements"
- For general conversation: use "general_chat"
- For web search: use "web_search"
- For coding tasks: use "write_code" or "code_explain"

History:
{history_text}

Respond with ONLY valid JSON (no markdown):
{{"action": "action_name", "done": false}}

If goal is achieved, set "done": true.
"""
        
        text = self.llm.generate(prompt)
        text = text.strip()
        
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        
        import json
        try:
            data = json.loads(text)
            return PlannerOutput(
                action=data.get("action", "general_chat"),
                input={},
                done=data.get("done", False)
            )
        except:
            return PlannerOutput(action="general_chat", input={}, done=True)
    
    def decide(self, goal: str, available_actions: dict, history: list[dict], required_input: dict = None) -> PlannerOutput:
        return self.decide_action_only(goal, available_actions, history)
    
    def chat_directly(self, message: str) -> str:
        return self.llm.generate(message)
