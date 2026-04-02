import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from cost_advisor_module.config import GEMINI_MODEL
from cost_advisor_module.models import AdvisoryRequest, RepoCostMetric

try:
    from cost_advisor_module.service import MissingGeminiApiKeyError, generate_advice
except Exception:
    MissingGeminiApiKeyError = RuntimeError
    generate_advice = None


def fallback_advice(metrics: list[RepoCostMetric]) -> str:
    lines: list[str] = [
        "Cost Suggestions",
        "",
    ]

    for metric in metrics:
        lines.append(
            f"- {metric.repo_name} ({metric.deployed_env}, {metric.criticality_tier}): estimated ${metric.monthly_cost_usd:.0f}/month."
        )

        avg_cpu = metric.infrastructure.avg_cpu_percent
        peak_cpu = metric.infrastructure.peak_cpu_percent
        compute = metric.infrastructure.provisioned_compute

        if metric.criticality_tier == "Tier 1" and peak_cpu > 80:
            lines.append(
                "  Keep production headroom, but move to autoscaled Graviton-backed compute such as `c7g.large` or `c7g.xlarge` instead of static oversized nodes."
            )
        elif avg_cpu <= 10:
            lines.append(
                "  This workload looks heavily over-provisioned. Consider `t4g.small` or `t4g.medium`, AWS App Runner, or Cloud Run for scale-to-zero savings."
            )
        elif avg_cpu <= 25:
            lines.append(
                "  Rightsize to `t4g.medium` / `t4g.large`, or use ECS Fargate with 0.5-1 vCPU tasks plus autoscaling."
            )
        else:
            lines.append(
                "  Keep moderate compute, but prefer `c7g.large` or `t4g.large` with autoscaling instead of fixed higher-cost instances."
            )

        if "fargate" not in compute.lower() and metric.deployed_env != "Production":
            lines.append(
                "  For non-production environments, shift to Spot-backed workers or ephemeral preview environments to reduce idle spend."
            )

        if metric.database:
            if metric.database.avg_read_iops <= 120:
                lines.append(
                    "  Database load appears light. Consider `db.t4g.small` / `db.t4g.medium` or Aurora Serverless v2 to cut idle database cost."
                )
            else:
                lines.append(
                    "  Keep a managed database, but evaluate Graviton RDS classes and storage autoscaling to avoid over-allocation."
                )

        if metric.storage:
            utilization = 0.0
            if metric.storage.allocated_gb > 0:
                utilization = metric.storage.used_gb / metric.storage.allocated_gb

            if metric.storage.last_accessed_days_ago > 30 or utilization < 0.55:
                lines.append(
                    "  Storage looks underused or cold. Move old artifacts to S3 Intelligent-Tiering or Glacier and reduce provisioned capacity."
                )

        if metric.unit_economics.cost_per_1k_users > 250:
            lines.append(
                "  Unit economics are high. Prefer smaller shared instances, serverless entry points, and reserved capacity only for consistently hot paths."
            )

        lines.append("")

    lines.append(
        "Best-fit cloud options: Graviton EC2 (`t4g` / `c7g`), ECS Fargate with autoscaling, Aurora Serverless v2 for bursty databases, and S3 Intelligent-Tiering for cold storage."
    )
    return "\n".join(lines).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate cost advisor suggestions")
    parser.add_argument("--payload-file", required=True, help="Path to advisory request JSON")
    args = parser.parse_args()

    payload = json.loads(Path(args.payload_file).read_text(encoding="utf-8"))
    request = AdvisoryRequest.model_validate(payload)

    advice = ""
    provider = "local-heuristic"
    model = "cost-advisor-fallback"
    fallback = True
    error = None

    if generate_advice is not None:
      try:
          advice = generate_advice(request.metrics)
          provider = "google-gemini"
          model = GEMINI_MODEL
          fallback = False
      except MissingGeminiApiKeyError as exc:
          error = str(exc)
      except Exception as exc:
          error = str(exc)

    if not advice:
        advice = fallback_advice(request.metrics)

    print(json.dumps({
        "provider": provider,
        "model": model,
        "repositories_analyzed": len(request.metrics),
        "advice": advice,
        "fallback": fallback,
        "error": error,
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
