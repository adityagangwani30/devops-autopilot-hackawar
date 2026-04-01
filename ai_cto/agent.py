from typing import Any, Optional
from ai_cto.planner import Planner
from ai_cto.actions.registry import ActionRegistry
from ai_cto.config import NVIDIA_API_KEY

if not NVIDIA_API_KEY:
    raise ValueError("NVIDIA_API_KEY not set in .env")


class AIAgent:
    def __init__(self, goal: str, max_steps: int = 8):
        self.goal = goal
        self.planner = Planner()
        self.history: list[dict] = []
        self.max_steps = max_steps
    
    def _extract_repo(self) -> str:
        import re
        # Find all occurrences of owner/repo pattern
        matches = re.findall(r'([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)', self.goal)
        # Return the last match (usually the actual repo, not "CI/CD" or similar)
        if matches:
            return matches[-1]
        return ""
    
    def run(self) -> dict:
        print(f"Starting AI Assistant for: {self.goal}")
        print("=" * 50)
        
        last_result = {}
        target_repo = self._extract_repo()
        
        for step in range(self.max_steps):
            available_actions = ActionRegistry.get_actions()
            
            # Only ask LLM for action, not input
            decision = self.planner.decide_action_only(self.goal, available_actions, self.history)
            
            print(f"\nStep {step + 1}: {decision.action}")
            
            if decision.done:
                print("Done!")
                break
            
            try:
                action_class = ActionRegistry.get(decision.action)
                
                # Build input based on action type - always use extracted repo
                action_input = {}
                if decision.action == "fetch_workflows":
                    action_input = {"repo": target_repo}
                elif decision.action == "comment_on_pr":
                    action_input = {"repo": target_repo}
                
                print(f"Input: {action_input}")
                
                action = action_class(**action_input)
                
                result = action.run(**last_result)
                last_result = result
                
                self.history.append({
                    "step": step + 1,
                    "action": decision.action,
                    "input": action_input,
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
