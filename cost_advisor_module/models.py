from typing import Any

from pydantic import BaseModel, Field


class UnitEconomics(BaseModel):
    monthly_active_users: int = Field(..., ge=0)
    cost_per_1k_users: float = Field(..., ge=0)


class Infrastructure(BaseModel):
    provider: str
    provisioned_compute: str
    avg_cpu_percent: float = Field(..., ge=0, le=100)
    peak_cpu_percent: float = Field(..., ge=0, le=100)


class Database(BaseModel):
    type: str
    allocated_storage_gb: float = Field(..., ge=0)
    avg_read_iops: float = Field(..., ge=0)


class Storage(BaseModel):
    allocated_gb: float = Field(..., ge=0)
    used_gb: float = Field(..., ge=0)
    last_accessed_days_ago: int = Field(..., ge=0)


class RepoCostMetric(BaseModel):
    repo_name: str
    deployed_env: str
    criticality_tier: str
    monthly_cost_usd: float = Field(..., ge=0)
    unit_economics: UnitEconomics
    infrastructure: Infrastructure
    database: Database | None = None
    storage: Storage | None = None


class AdvisoryRequest(BaseModel):
    metrics: list[RepoCostMetric] = Field(..., min_length=1)


class AdvisoryResponse(BaseModel):
    provider: str
    model: str
    repositories_analyzed: int
    advice: str


class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_api_key_configured: bool
    sample_metrics_available: bool


class SampleMetricsResponse(BaseModel):
    metrics: list[RepoCostMetric]


def dump_metrics(metrics: list[RepoCostMetric]) -> list[dict[str, Any]]:
    return [metric.model_dump(exclude_none=True) for metric in metrics]
