from pydantic import BaseModel
import google.generativeai as genai
from typing import Optional
from ai_cto.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)


class PlannerOutput(BaseModel):
    action: str
    input: dict
    done: bool = False


class Planner:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-2.5-flash")
    
    def decide(self, goal: str, available_actions: dict, history: list[dict], required_input: dict = None) -> PlannerOutput:
        history_text = "\n".join([
            f"- Step {i+1}: {h.get('action', '')}"
            for i, h in enumerate(history)
        ])
        
        actions_text = "\n".join([
            f"- {name}: {info['description']}"
            for name, info in available_actions.items()
        ])
        
        input_hint = ""
        if required_input:
            input_hint = f"\nREQUIRED INPUT: You MUST include these values in your response: {required_input}"
        
        prompt = f"""You are an AI assistant. Choose the best action to respond to the user's request.

User request: {goal}

Available actions:
{actions_text}
{input_hint}

Guidelines:
- For GitHub analysis: use "fetch_workflows" FIRST with input {{"repo": "owner/repo"}}
- For analyzing fetched workflows: use "analyze_workflows" (takes workflows from previous step)
- For generating suggestions: use "suggest_improvements" (takes issues from previous step)
- For general conversation, use "general_chat"

History:
{history_text}

Respond with ONLY valid JSON (no markdown):
{{"action": "action_name", "input": {{"key": "value"}}, "done": false}}

If goal is achieved, set "done": true.
"""
        
        response = self.model.generate_content(prompt)
        text = response.text.strip()
        
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        
        import json
        try:
            data = json.loads(text)
            return PlannerOutput(**data)
        except:
            return PlannerOutput(action="general_chat", input={"message": goal}, done=True)
    
    def chat_directly(self, message: str) -> str:
        response = self.model.generate_content(message)
        return response.text.strip()
