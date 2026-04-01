from openai import OpenAI
from typing import Optional
from ai_cto.config import NVIDIA_API_KEY


class LLMClient:
    def __init__(self, model: str = "nvidia/nemotron-3-super-120b-a12b"):
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=NVIDIA_API_KEY
        )
        self.model = model
    
    def generate(self, prompt: str, temperature: float = 0.5, max_tokens: int = 4096) -> str:
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=1,
            max_tokens=max_tokens,
            stream=False
        )
        return completion.choices[0].message.content
    
    def generate_with_thinking(self, prompt: str, temperature: float = 0.5, max_tokens: int = 8192) -> str:
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=0.95,
            max_tokens=max_tokens,
            extra_body={
                "chat_template_kwargs": {"enable_thinking": True},
                "reasoning_budget": 4096
            },
            stream=False
        )
        return completion.choices[0].message.content
    
    def chat(self, messages: list[dict], temperature: float = 0.5, max_tokens: int = 4096) -> str:
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            top_p=1,
            max_tokens=max_tokens,
            stream=False
        )
        return completion.choices[0].message.content
