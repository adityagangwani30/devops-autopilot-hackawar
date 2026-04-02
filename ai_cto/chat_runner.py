import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from ai_cto.chat_service import generate_chat_reply


def main() -> int:
    parser = argparse.ArgumentParser(description="Run AI CTO chat with knowledge graph context")
    parser.add_argument(
        "--payload-file",
        required=True,
        help="Path to a JSON payload file for the chat request",
    )
    args = parser.parse_args()

    payload = json.loads(Path(args.payload_file).read_text(encoding="utf-8"))
    result = generate_chat_reply(
        messages=payload.get("messages", []),
        system=payload.get("system"),
        temperature=payload.get("temperature", 0.5),
        max_tokens=payload.get("max_tokens", 4096),
        knowledge_graph=payload.get("knowledge_graph"),
        use_knowledge_graph_tool=payload.get("use_knowledge_graph_tool", True),
    )
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
