import json

from cost_advisor_module.service import (
    MissingGeminiApiKeyError,
    generate_advice_from_raw,
    load_sample_metrics_raw,
)


def main() -> None:
    repo_cost_metrics_raw = load_sample_metrics_raw()
    json.loads(repo_cost_metrics_raw)

    try:
        advice = generate_advice_from_raw(repo_cost_metrics_raw)
    except MissingGeminiApiKeyError as exc:
        print(f"Error: {exc}")
        raise SystemExit(1) from exc

    print("Cost Optimization Advisor Report")
    print("=" * 34)
    print(advice)


if __name__ == "__main__":
    main()
