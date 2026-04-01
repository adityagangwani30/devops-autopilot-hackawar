import json
from pathlib import Path

from google import genai
from google.genai import types

from cost_advisor_module.config import GEMINI_MODEL, SYSTEM_PROMPT, get_gemini_api_key
from cost_advisor_module.models import RepoCostMetric, dump_metrics


MODULE_DIR = Path(__file__).resolve().parent
SAMPLE_METRICS_PATH = MODULE_DIR / "repo_cost_metrics.json"


class MissingGeminiApiKeyError(RuntimeError):
    pass


def load_sample_metrics_raw() -> str:
    return SAMPLE_METRICS_PATH.read_text(encoding="utf-8")


def load_sample_metrics() -> list[RepoCostMetric]:
    raw_metrics = json.loads(load_sample_metrics_raw())
    return [RepoCostMetric.model_validate(metric) for metric in raw_metrics]


def serialize_metrics(metrics: list[RepoCostMetric]) -> str:
    payload = dump_metrics(metrics)
    return json.dumps(payload, indent=2)


def generate_advice_from_raw(raw_metrics: str) -> str:
    api_key = get_gemini_api_key()
    if not api_key:
        raise MissingGeminiApiKeyError("GEMINI_API_KEY environment variable is not set.")

    json.loads(raw_metrics)

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=raw_metrics,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
        ),
    )

    return response.text or ""


def generate_advice(metrics: list[RepoCostMetric]) -> str:
    return generate_advice_from_raw(serialize_metrics(metrics))
