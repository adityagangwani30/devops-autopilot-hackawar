"""
FastAPI Backend - Optimized for Non-Blocking Operation
========================================================
Key optimizations:
1. Cached endpoint - avoids repeated file I/O
2. Local processing - no Gemini API required for basic summaries
3. Async-ready - can be extended for async endpoints
4. Graceful degradation - works even without API keys
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any

from cost_advisor_module.config import (
    GEMINI_MODEL,
    get_allowed_origins,
    get_gemini_api_key,
)
from cost_advisor_module.service_optimized import (
    get_cost_summary,
    load_sample_metrics,
    generate_advice,
    invalidate_cache,
    CACHE_TTL_SECONDS,
    SAMPLE_METRICS_PATH,
)


app = FastAPI(
    title="Cost Optimization Advisor API",
    version="1.0.0",
    description=(
        "FastAPI service for FinOps-style repository cost analysis. "
        "Provides cached endpoints with local processing - no API key required for summaries."
    ),
)

allowed_origins = get_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allowed_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Response models
class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_api_key_configured: bool
    sample_metrics_available: bool


class CostSummaryResponse(BaseModel):
    total_monthly_cost_usd: float
    repository_count: int
    average_cost_per_repo: float
    top_cost_drivers: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    generated_at: str
    cache_ttl_seconds: int


class AdvisoryResponse(BaseModel):
    provider: str
    model: str
    repositories_analyzed: int
    advice: str


# ═══════════════════════════════════════════════════════════════════
# OPTIMIZED ENDPOINTS - Using cached service
# ═══════════════════════════════════════════════════════════════════


@app.get("/", response_model=HealthResponse, tags=["system"])
def root() -> HealthResponse:
    """Health check - doesn't load any data, just checks file exists."""
    return HealthResponse(
        status="ok",
        service="cost-optimization-advisor",
        gemini_api_key_configured=bool(get_gemini_api_key()),
        sample_metrics_available=SAMPLE_METRICS_PATH.exists(),
    )


@app.get("/health", response_model=HealthResponse, tags=["system"])
def healthcheck() -> HealthResponse:
    """Alias for root - returns health status."""
    return root()


@app.get("/metrics/sample", tags=["metrics"])
def get_sample_metrics() -> dict[str, Any]:
    """
    Get raw sample metrics (cached).
    Returns raw JSON data for debugging purposes.
    """
    return {"metrics": load_sample_metrics()}


@app.get("/summary", response_model=CostSummaryResponse, tags=["summary"])
def get_summary() -> CostSummaryResponse:
    """
    OPTIMIZED: Get processed cost summary (cached).

    This endpoint:
    - Uses in-memory cache (60s TTL)
    - Processes data locally (no API call needed)
    - Returns a clean Summary Object with:
      - Total cost
      - Top cost drivers
      - Actionable recommendations

    Much faster than /advice endpoint - use this for dashboard display.
    """
    try:
        summary = get_cost_summary()
        return CostSummaryResponse(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {e}")


@app.post("/cache/invalidate", tags=["cache"])
def clear_cache() -> dict[str, str]:
    """
    Manually invalidate cache - useful for development.
    Forces reload of metrics on next request.
    """
    invalidate_cache("metrics")
    invalidate_cache("summary")
    return {"status": "cleared", "message": "Cache invalidated"}


@app.get("/cache/status", tags=["cache"])
def cache_status() -> dict[str, Any]:
    """Check cache configuration."""
    return {
        "ttl_seconds": CACHE_TTL_SECONDS,
        "enabled": True,
        "note": "Cache auto-expires after TTL seconds",
    }


# Legacy endpoints (still work but use local processing as fallback)
class AdvisoryRequest(BaseModel):
    metrics: list[dict[str, Any]] = Field(..., min_length=1)


@app.post("/advice", response_model=AdvisoryResponse, tags=["advisor"])
def generate_cost_advice(payload: AdvisoryRequest) -> AdvisoryResponse:
    """
    Generate AI-powered advice.

    Uses Gemini API if available, otherwise falls back to local processing.
    Local processing provides actionable recommendations without API costs.
    """
    try:
        advice = generate_advice(payload.metrics)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Failed to generate advisory: {exc}"
        )

    return AdvisoryResponse(
        provider="local-fallback" if not get_gemini_api_key() else "google-gemini",
        model=GEMINI_MODEL,
        repositories_analyzed=len(payload.metrics),
        advice=advice,
    )


@app.post("/advice/sample", response_model=AdvisoryResponse, tags=["advisor"])
def generate_sample_cost_advice() -> AdvisoryResponse:
    """
    Generate advice using sample metrics.
    Convenience endpoint - same as posting to /advice with sample data.
    """
    metrics = load_sample_metrics()
    return generate_cost_advice(AdvisoryRequest(metrics=metrics))
