from pydantic import BaseModel
import requests
from ai_cto.actions.base import Action
from ai_cto.config import GEMINI_API_KEY
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)


class WebSearchInput(BaseModel):
    query: str


class WebSearch(Action):
    name: str = "web_search"
    description: str = "Search the web for information"
    
    def run(self, **kwargs) -> dict:
        query = kwargs.get("query", "")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            f"Search the web for: {query}. Provide a concise answer with sources."
        )
        
        return {"query": query, "answer": response.text.strip()}


class CodeExplainInput(BaseModel):
    code: str
    language: str = "python"


class CodeExplain(Action):
    name: str = "code_explain"
    description: str = "Explain what a piece of code does"
    
    def run(self, **kwargs) -> dict:
        code = kwargs.get("code", "")
        language = kwargs.get("language", "python")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""Explain this {language} code in simple terms:

```{language}
{code}
```

Provide a brief explanation (2-3 sentences)."""
        
        response = model.generate_content(prompt)
        
        return {"explanation": response.text.strip()}


class GeneralChatInput(BaseModel):
    message: str


class GeneralChat(Action):
    name: str = "general_chat"
    description: str = "General conversation and questions"
    
    def run(self, **kwargs) -> dict:
        message = kwargs.get("message", "")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(message)
        
        return {"response": response.text.strip()}


class WriteCodeInput(BaseModel):
    task: str
    language: str = "python"


class WriteCode(Action):
    name: str = "write_code"
    description: str = "Write code for a specific task"
    
    def run(self, **kwargs) -> dict:
        task = kwargs.get("task", "")
        language = kwargs.get("language", "python")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""Write {language} code to accomplish this task:

{task}

Provide clean, working code with brief comments."""
        
        response = model.generate_content(prompt)
        
        return {"code": response.text.strip(), "language": language}


class DebugCodeInput(BaseModel):
    code: str
    error: str = ""


class DebugCode(Action):
    name: str = "debug_code"
    description: str = "Help debug code errors"
    
    def run(self, **kwargs) -> dict:
        code = kwargs.get("code", "")
        error = kwargs.get("error", "")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""Debug this code. Error message: {error}

Code:
```{code}
```

Provide the fixed code and explain the issue."""
        
        response = model.generate_content(prompt)
        
        return {"fix": response.text.strip()}


class SummarizeTextInput(BaseModel):
    text: str
    max_words: int = 50


class SummarizeText(Action):
    name: str = "summarize_text"
    description: str = "Summarize long text"
    
    def run(self, **kwargs) -> dict:
        text = kwargs.get("text", "")
        max_words = kwargs.get("max_words", 50)
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"Summarize this in {max_words} words or less:\n\n{text}"
        
        response = model.generate_content(prompt)
        
        return {"summary": response.text.strip()}


class TranslateTextInput(BaseModel):
    text: str
    target_lang: str


class TranslateText(Action):
    name: str = "translate"
    description: str = "Translate text to another language"
    
    def run(self, **kwargs) -> dict:
        text = kwargs.get("text", "")
        target = kwargs.get("target_lang", "English")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"Translate to {target}:\n\n{text}"
        
        response = model.generate_content(prompt)
        
        return {"translation": response.text.strip(), "language": target}
