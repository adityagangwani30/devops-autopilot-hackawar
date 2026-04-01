import requests
from ai_cto.actions.base import Action
from ai_cto.llm import LLMClient


class WebSearch(Action):
    name: str = "web_search"
    description: str = "Search the web for information"
    
    def run(self, **kwargs) -> dict:
        query = kwargs.get("query", "")
        
        llm = LLMClient()
        response = llm.generate(f"Search the web for: {query}. Provide a concise answer with sources.")
        
        return {"query": query, "answer": response.strip()}


class CodeExplain(Action):
    name: str = "code_explain"
    description: str = "Explain what a piece of code does"
    
    def run(self, **kwargs) -> dict:
        code = kwargs.get("code", "")
        language = kwargs.get("language", "python")
        
        llm = LLMClient()
        prompt = f"""Explain this {language} code in simple terms:

```{language}
{code}
```

Provide a brief explanation (2-3 sentences)."""
        
        response = llm.generate(prompt)
        
        return {"explanation": response.strip()}


class GeneralChat(Action):
    name: str = "general_chat"
    description: str = "General conversation and questions"
    
    def run(self, **kwargs) -> dict:
        message = kwargs.get("message", "")
        
        llm = LLMClient()
        response = llm.generate(message)
        
        return {"response": response.strip()}


class WriteCode(Action):
    name: str = "write_code"
    description: str = "Write code for a specific task"
    
    def run(self, **kwargs) -> dict:
        task = kwargs.get("task", "")
        language = kwargs.get("language", "python")
        
        llm = LLMClient()
        prompt = f"""Write {language} code to accomplish this task:

{task}

Provide clean, working code with brief comments."""
        
        response = llm.generate(prompt)
        
        return {"code": response.strip(), "language": language}


class DebugCode(Action):
    name: str = "debug_code"
    description: str = "Help debug code errors"
    
    def run(self, **kwargs) -> dict:
        code = kwargs.get("code", "")
        error = kwargs.get("error", "")
        
        llm = LLMClient()
        prompt = f"""Debug this code. Error message: {error}

Code:
```{code}
```

Provide the fixed code and explain the issue."""
        
        response = llm.generate(prompt)
        
        return {"fix": response.strip()}


class SummarizeText(Action):
    name: str = "summarize_text"
    description: str = "Summarize long text"
    
    def run(self, **kwargs) -> dict:
        text = kwargs.get("text", "")
        max_words = kwargs.get("max_words", 50)
        
        llm = LLMClient()
        prompt = f"Summarize this in {max_words} words or less:\n\n{text}"
        
        response = llm.generate(prompt)
        
        return {"summary": response.strip()}


class TranslateText(Action):
    name: str = "translate"
    description: str = "Translate text to another language"
    
    def run(self, **kwargs) -> dict:
        text = kwargs.get("text", "")
        target = kwargs.get("target_lang", "English")
        
        llm = LLMClient()
        prompt = f"Translate to {target}:\n\n{text}"
        
        response = llm.generate(prompt)
        
        return {"translation": response.strip(), "language": target}
