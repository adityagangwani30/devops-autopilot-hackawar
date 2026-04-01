from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from cost_advisor_module.config import GEMINI_MODEL, get_allowed_origins, get_gemini_api_key
from cost_advisor_module.models import (
    AdvisoryRequest,
    AdvisoryResponse,
    HealthResponse,
    SampleMetricsResponse,
)
from cost_advisor_module.service import (
    MissingGeminiApiKeyError,
    SAMPLE_METRICS_PATH,
    generate_advice,
    load_sample_metrics,
)


app = FastAPI(
    title="Cost Optimization Advisor API",
    version="1.0.0",
    description=(
        "FastAPI service for FinOps-style repository cost analysis using Gemini. "
        "Expose these endpoints to other internal tools to fetch sample metrics or "
        "generate business-focused cost optimization advice."
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


@app.get("/", response_model=HealthResponse, tags=["system"])
def root() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="cost-optimization-advisor",
        gemini_api_key_configured=bool(get_gemini_api_key()),
        sample_metrics_available=SAMPLE_METRICS_PATH.exists(),
    )


@app.get("/health", response_model=HealthResponse, tags=["system"])
def healthcheck() -> HealthResponse:
    return root()


@app.get("/metrics/sample", response_model=SampleMetricsResponse, tags=["metrics"])
def get_sample_metrics() -> SampleMetricsResponse:
    return SampleMetricsResponse(metrics=load_sample_metrics())


@app.post("/advice", response_model=AdvisoryResponse, tags=["advisor"])
def generate_cost_advice(payload: AdvisoryRequest) -> AdvisoryResponse:
    try:
        advice = generate_advice(payload.metrics)
    except MissingGeminiApiKeyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid metrics payload: {exc}") from exc
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=502, detail=f"Failed to generate advisory: {exc}") from exc

    return AdvisoryResponse(
        provider="google-gemini",
        model=GEMINI_MODEL,
        repositories_analyzed=len(payload.metrics),
        advice=advice,
    )


@app.post("/advice/sample", response_model=AdvisoryResponse, tags=["advisor"])
def generate_sample_cost_advice() -> AdvisoryResponse:
    metrics = load_sample_metrics()
    return generate_cost_advice(AdvisoryRequest(metrics=metrics))
