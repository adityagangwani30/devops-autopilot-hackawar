import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from ai_cto.analysis_pipeline import run_combined_analysis


def main() -> int:
    parser = argparse.ArgumentParser(description="Run AI CTO repository analysis")
    parser.add_argument("--repo", required=True, help="GitHub repository in owner/name format")
    parser.add_argument("--github-token", dest="github_token", help="GitHub access token override")
    args = parser.parse_args()

    result = run_combined_analysis(repo=args.repo, github_token=args.github_token)
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
