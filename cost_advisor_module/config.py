import os


GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_KEY_ENV = "GEMINI_API_KEY"
CORS_ALLOW_ORIGINS_ENV = "COST_ADVISOR_CORS_ORIGINS"
DEFAULT_CORS_ORIGINS = "*"

SYSTEM_PROMPT = """You are the AI CTO's Cost Optimization Engine. 
Analyze the provided JSON containing infrastructure KPIs, unit economics, and database metrics.
Rules:
1. Identify over-provisioned compute (low CPU, high cost).
2. Flag 'zombie' resources (storage not accessed in > 30 days).
3. Analyze unit economics (cost per user). If internal tools have absurdly high unit costs, flag them.
4. NEVER recommend downsizing Tier 1 (Production) services with peak CPU over 80%.
Format your response as a clear, plain-English summary with bulleted actionable advice."""


def get_gemini_api_key() -> str | None:
    return os.getenv(GEMINI_API_KEY_ENV)


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv(CORS_ALLOW_ORIGINS_ENV, DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
