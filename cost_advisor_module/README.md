# Cost Optimization Advisor API

This folder is now a self-contained FastAPI service for FinOps-style repository cost analysis.

## What it exposes

- `GET /`
- `GET /health`
- `GET /metrics/sample`
- `POST /advice`
- `POST /advice/sample`

FastAPI also provides interactive docs at:

- `/docs`
- `/redoc`

## Environment variables

- `GEMINI_API_KEY`: Required for advisory-generation endpoints.
- `COST_ADVISOR_CORS_ORIGINS`: Optional comma-separated CORS origins. Defaults to `*`.

## Run locally

From the repository root:

```powershell
python -m pip install -r cost_advisor_module\requirements.txt
uvicorn cost_advisor_module.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000/docs
```

## Example requests

Fetch the bundled mock metrics:

```powershell
curl http://127.0.0.1:8000/metrics/sample
```

Generate advice from the bundled sample:

```powershell
curl -X POST http://127.0.0.1:8000/advice/sample
```

Generate advice from another project:

```powershell
curl -X POST http://127.0.0.1:8000/advice ^
  -H "Content-Type: application/json" ^
  -d "{\"metrics\":[{\"repo_name\":\"payments-api\",\"deployed_env\":\"Production\",\"criticality_tier\":\"Tier 2\",\"monthly_cost_usd\":640,\"unit_economics\":{\"monthly_active_users\":9000,\"cost_per_1k_users\":71.11},\"infrastructure\":{\"provider\":\"AWS\",\"provisioned_compute\":\"ECS Fargate\",\"avg_cpu_percent\":21,\"peak_cpu_percent\":49},\"database\":{\"type\":\"PostgreSQL\",\"allocated_storage_gb\":200,\"avg_read_iops\":180}}]}"
```
