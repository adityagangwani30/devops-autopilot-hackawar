"""
Cost Advisor Service - Optimized with Caching
==============================================
Key optimizations:
1. Lazy loading - don't load JSON on module import
2. In-memory cache with TTL - avoid repeated file I/O
3. Async-safe caching - thread-safe for multiple requests
4. Fallback to local processing if Gemini API unavailable
"""

import json
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Optional Gemini import - gracefully handle if not available
try:
    from google import genai
    from google.genai import types

    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


MODULE_DIR = Path(__file__).resolve().parent
SAMPLE_METRICS_PATH = MODULE_DIR / "repo_cost_metrics.json"

# Cache configuration
CACHE_TTL_SECONDS = 60  # 1 minute cache
_cache_lock = threading.Lock()
_cache_data: dict[str, tuple[Any, float]] = {}  # key -> (data, timestamp)


class MissingGeminiApiKeyError(RuntimeError):
    pass


def _get_from_cache(key: str) -> Any | None:
    """Thread-safe cache retrieval with TTL check."""
    with _cache_lock:
        if key not in _cache_data:
            return None
        data, timestamp = _cache_data[key]
        if time.time() - timestamp > CACHE_TTL_SECONDS:
            del _cache_data[key]
            return None
        return data


def _set_cache(key: str, data: Any) -> None:
    """Thread-safe cache storage."""
    with _cache_lock:
        _cache_data[key] = (data, time.time())


def invalidate_cache(key: str = "metrics") -> None:
    """Manually invalidate cache (useful for hot-reload)."""
    with _cache_lock:
        _cache_data.pop(key, None)


def load_sample_metrics_raw() -> str:
    """Lazy load - reads file only when needed, not on import."""
    return SAMPLE_METRICS_PATH.read_text(encoding="utf-8")


def load_sample_metrics() -> list[dict[str, Any]]:
    """Load and validate metrics with caching."""
    cache_key = "metrics"

    # Check cache first
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    # Load and parse (lazy - only when cache miss)
    raw_metrics = json.loads(load_sample_metrics_raw())

    # Store in cache
    _set_cache(cache_key, raw_metrics)
    return raw_metrics


def process_summary(metrics: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Transform raw metrics into a clean Summary Object.
    This replaces the need for Gemini API call for basic summaries.
    """
    if not metrics:
        return {
            "total_monthly_cost_usd": 0,
            "repository_count": 0,
            "top_cost_drivers": [],
            "recommendations": [],
        }

    # Calculate totals
    total_cost = sum(m.get("monthly_cost_usd", 0) for m in metrics)

    # Sort by cost to find top drivers
    sorted_by_cost = sorted(
        metrics, key=lambda m: m.get("monthly_cost_usd", 0), reverse=True
    )
    top_drivers = [
        {
            "repo_name": m.get("repo_name"),
            "monthly_cost_usd": m.get("monthly_cost_usd"),
            "criticality_tier": m.get("criticality_tier"),
            "environment": m.get("deployed_env"),
        }
        for m in sorted_by_cost[:3]
    ]

    # Generate actionable recommendations (local processing)
    recommendations = []

    for m in metrics:
        # Check for over-provisioned compute (low CPU, high cost)
        infra = m.get("infrastructure", {})
        if infra:
            avg_cpu = infra.get("avg_cpu_percent", 0)
            if avg_cpu < 20 and m.get("monthly_cost_usd", 0) > 300:
                recommendations.append(
                    {
                        "type": "right-size",
                        "severity": "high",
                        "repo": m.get("repo_name"),
                        "message": f"Low CPU utilization ({avg_cpu}%) - consider downsizing {infra.get('provisioned_compute')}",
                    }
                )

        # Check for zombie storage (not accessed in 30+ days)
        storage = m.get("storage", {})
        if storage:
            days_unused = storage.get("last_accessed_days_ago", 0)
            if days_unused > 30:
                recommendations.append(
                    {
                        "type": "zombie-resource",
                        "severity": "medium",
                        "repo": m.get("repo_name"),
                        "message": f"Storage unused for {days_unused} days - consider archiving or deletion",
                    }
                )

        # Check for inefficient unit economics
        unit_econ = m.get("unit_economics", {})
        if unit_econ:
            cost_per_1k = unit_econ.get("cost_per_1k_users", 0)
            users = unit_econ.get("monthly_active_users", 0)
            if cost_per_1k > 500 and users < 100:
                recommendations.append(
                    {
                        "type": "unit-economics",
                        "severity": "medium",
                        "repo": m.get("repo_name"),
                        "message": f"High cost per user (${cost_per_1k:.2f}/1K users) - review pricing tier",
                    }
                )

    return {
        "total_monthly_cost_usd": total_cost,
        "repository_count": len(metrics),
        "average_cost_per_repo": total_cost / len(metrics) if metrics else 0,
        "top_cost_drivers": top_drivers,
        "recommendations": recommendations,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "cache_ttl_seconds": CACHE_TTL_SECONDS,
    }


def get_cost_summary() -> dict[str, Any]:
    """
    Main entry point - returns processed Summary Object.
    Uses caching to avoid repeated file I/O and processing.
    """
    cache_key = "summary"

    # Check cache first
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    # Load and process
    metrics = load_sample_metrics()
    summary = process_summary(metrics)

    # Store in cache
    _set_cache(cache_key, summary)
    return summary


# Legacy function - kept for backward compatibility
def generate_advice(metrics: list[dict[str, Any]]) -> str:
    """
    Generate AI-powered advice (requires Gemini API).
    Falls back to local processing if API unavailable.
    """
    from cost_advisor_module.config import (
        GEMINI_MODEL,
        SYSTEM_PROMPT,
        get_gemini_api_key,
    )

    # Try local processing first (fast, no API needed)
    local_summary = process_summary(metrics)

    if not GEMINI_AVAILABLE:
        # Return local summary as advice
        return _format_local_advice(local_summary)

    api_key = get_gemini_api_key()
    if not api_key:
        # Fall back to local processing
        return _format_local_advice(local_summary)

    try:
        # Try Gemini API
        client = genai.Client(api_key=api_key)
        json_str = json.dumps(metrics, indent=2)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=json_str,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
            ),
        )
        return response.text or _format_local_advice(local_summary)
    except Exception as e:
        # Graceful fallback to local processing
        print(f"[Warning] Gemini API failed: {e}. Using local processing.")
        return _format_local_advice(local_summary)


def _format_local_advice(summary: dict[str, Any]) -> str:
    """Format local summary as actionable advice."""
    lines = ["## Cost Optimization Summary\n"]

    lines.append(f"**Total Monthly Cost:** ${summary['total_monthly_cost_usd']:,.2f}")
    lines.append(f"**Repositories Analyzed:** {summary['repository_count']}\n")

    if summary.get("top_cost_drivers"):
        lines.append("### Top Cost Drivers:")
        for driver in summary["top_cost_drivers"]:
            lines.append(
                f"- **{driver['repo_name']}**: ${driver['monthly_cost_usd']}/mo ({driver['criticality_tier']})"
            )
        lines.append("")

    if summary.get("recommendations"):
        lines.append("### Actionable Recommendations:")
        for rec in summary["recommendations"]:
            severity_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(
                rec.get("severity", "low"), "🟢"
            )
            lines.append(
                f"{severity_emoji} **{rec['type'].replace('-', ' ').title()}**: {rec['message']}"
            )

    return "\n".join(lines)
