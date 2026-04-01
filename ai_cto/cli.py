import typer
import asyncio
from typing import Optional
from ai_cto.agent import AIAgent
from ai_cto.config import NVIDIA_API_KEY, validate
from ai_cto.utils import Loader

app = typer.Typer()

DEFAULT_SYSTEM_PROMPT = """You are an AI assistant that helps with various tasks including:
- Writing and explaining code
- Debugging code issues
- Searching the web for information
- Analyzing GitHub CI/CD workflows
- Translating text
- Summarizing content
- General conversation

Be helpful, concise, and friendly."""


def print_header():
    print("\n" + "=" * 60)
    print("  🤖 AI Assistant (type 'exit' to quit, 'help' for commands)")
    print("=" * 60 + "\n")


def print_help():
    print("""
Available commands:
  help    - Show this help message
  clear   - Clear chat history
  analyze - Analyze a GitHub repo (usage: analyze owner/repo)
  exit    - Exit the chat

Examples:
  - "Explain what this code does: def foo(x): return x * 2"
  - "Write a Python function to sort a list"
  - "Search for the latest Python 3.13 features"
  - "Translate 'Hello world' to Spanish"
  - "Summarize this article: [paste text]"
""")


@app.command()
def analyze(repo: str):
    validate()
    goal = f"Analyze CI/CD workflows for {repo} and suggest improvements"
    agent = AIAgent(goal)
    
    loader = Loader("Analyzing workflows")
    loader.start()
    try:
        result = agent.run()
    finally:
        loader.stop()
    
    print("\n" + "=" * 50)
    print("FINAL RESULTS")
    print("=" * 50)
    
    for step in result["history"]:
        print(f"\n{step.get('step', '?')}. {step.get('action', 'unknown')}")
        if "result" in step:
            r = step["result"]
            if "suggestions" in r:
                print("Suggestions:")
                for s in r["suggestions"]:
                    print(f"  - {s}")
            elif "issues" in r:
                print("Issues:")
                for i in r["issues"]:
                    print(f"  - {i.get('workflow', '')}: {i.get('issue', '')}")


@app.command()
def pr_review(repo: str, pr_number: int, message: Optional[str] = None):
    validate(github_required=True)
    
    if not message:
        goal = f"Review PR #{pr_number} on {repo} and suggest improvements"
        agent = AIAgent(goal)
        
        loader = Loader("Reviewing PR")
        loader.start()
        try:
            result = agent.run()
        finally:
            loader.stop()
        
        for step in result["history"]:
            if "result" in step and "suggestions" in step["result"]:
                suggestions = step["result"]["suggestions"]
                if suggestions:
                    message = "\n\n".join([f"- {s}" for s in suggestions])
                    break
    
    if message:
        from ai_cto.actions.github import CommentOnPR
        result = CommentOnPR(repo=repo, pr_number=pr_number, message=message).run()
        print(f"Comment posted: {result}")
    else:
        print("No suggestions to post")


def run_chat():
    validate()
    print_header()
    print_help()
    
    agent = AIAgent("")
    conversation = []
    
    while True:
        try:
            user_input = input("\nYou> ").strip()
        except EOFError:
            break
        
        if not user_input:
            continue
        
        if user_input.lower() in ["exit", "quit", "q"]:
            print("\nGoodbye! 👋")
            break
        
        if user_input.lower() in ["help", "h"]:
            print_help()
            continue
        
        if user_input.lower() == "clear":
            conversation = []
            print("Chat history cleared.")
            continue
        
        if user_input.lower().startswith("analyze "):
            repo = user_input[8:].strip()
            print(f"\nAnalyzing {repo}...")
            agent = AIAgent(f"Analyze CI/CD workflows for {repo} and suggest improvements")
            
            loader = Loader("Analyzing")
            loader.start()
            try:
                result = agent.run()
            finally:
                loader.stop()
            
            print("\nResults:")
            for step in result["history"]:
                if "result" in step:
                    r = step["result"]
                    if "suggestions" in r:
                        for s in r["suggestions"]:
                            print(f"  • {s}")
            continue
        
        loader = Loader("Thinking")
        loader.start()
        try:
            response = agent.chat(user_input)
        finally:
            loader.stop()
        
        print("\n" + response)
        
        conversation.append({"role": "user", "content": user_input})
        conversation.append({"role": "assistant", "content": response})


@app.command()
def chat():
    run_chat()


if __name__ == "__main__":
    app()