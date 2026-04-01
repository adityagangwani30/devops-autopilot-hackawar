from typing import Any, Optional
from ai_cto.planner import Planner
from ai_cto.actions.registry import ActionRegistry
from ai_cto.config import GEMINI_API_KEY

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env")


class AIAgent:
    def __init__(self, goal: str, max_steps: int = 8):
        self.goal = goal
        self.planner = Planner()
        self.history: list[dict] = []
        self.max_steps = max_steps
    
    def run(self) -> dict:
        print(f"Starting AI Assistant for: {self.goal}")
        print("=" * 50)
        
        last_result = {}
        
        for step in range(self.max_steps):
            available_actions = ActionRegistry.get_actions()
            
            required_input = {}
            if step == 0 and "analyze" in self.goal.lower() or "fetch" in self.goal.lower():
                import re
                match = re.search(r'([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)', self.goal)
                if match:
                    required_input = {"repo": match.group(1)}
            
            decision = self.planner.decide(self.goal, available_actions, self.history, required_input)
            
            print(f"\nStep {step + 1}: {decision.action}")
            print(f"Input: {decision.input}")
            
            if decision.done:
                print("Done!")
                break
            
            try:
                action_class = ActionRegistry.get(decision.action)
                action = action_class(**decision.input)
                
                result = action.run(**last_result)
                last_result = result
                
                self.history.append({
                    "step": step + 1,
                    "action": decision.action,
                    "input": decision.input,
                    "result": result
                })
                
                print(f"Result keys: {list(result.keys())}")
                if "issues" in result:
                    print(f"Issues found: {len(result['issues'])}")
                if "suggestions" in result:
                    print(f"Suggestions: {len(result['suggestions'])}")
                
            except Exception as e:
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()
                self.history.append({
                    "step": step + 1,
                    "action": decision.action,
                    "error": str(e)
                })
        
        return {
            "goal": self.goal,
            "history": self.history,
            "steps": len(self.history)
        }
    
    def chat(self, message: str) -> str:
        return self.planner.chat_directly(message)
