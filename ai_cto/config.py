from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY", "")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID", "")


def validate(github_required: bool = False):
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in .env")
    if github_required and not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN not set in .env")


class Config:
    GEMINI_API_KEY = GEMINI_API_KEY
    GITHUB_TOKEN = GITHUB_TOKEN
    SEARCH_API_KEY = SEARCH_API_KEY
    SEARCH_ENGINE_ID = SEARCH_ENGINE_ID
    
    @classmethod
    def validate(cls, github_required: bool = False):
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in .env")
        if github_required and not cls.GITHUB_TOKEN:
            raise ValueError("GITHUB_TOKEN not set in .env")