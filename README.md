# AI CTO Agent

A Python-based AI assistant that combines an intelligent agent framework with GitHub CI/CD analysis capabilities. The project supports both interactive chat and automated workflow analysis.

## Features

### Core Capabilities

- **Interactive Chat Interface** - Natural language conversations with AI
- **GitHub Workflow Analysis** - Analyzes CI/CD pipelines and suggests improvements
- **Multi-Tool Agent** - Dynamically selects the best action for each request
- **Extensible Actions** - Auto-loaded action system for easy expansion

### Available Actions

#### GitHub Actions (`actions/github.py`)
| Action | Description |
|--------|-------------|
| `fetch_workflows` | Fetches CI/CD workflow YAML files from `.github/workflows/` |
| `comment_on_pr` | Posts comments on GitHub pull requests |

#### DevOps Actions (`actions/devops.py`)
| Action | Description |
|--------|-------------|
| `analyze_workflows` | Analyzes workflow YAML for CI/CD issues |
| `suggest_improvements` | Uses Gemini to generate improvement suggestions |

#### General Tools (`actions/tools.py`)
| Action | Description |
|--------|-------------|
| `general_chat` | General conversation and Q&A |
| `web_search` | Search the web for information |
| `code_explain` | Explain what a piece of code does |
| `write_code` | Write code for a specific task |
| `debug_code` | Help debug code errors |
| `summarize_text` | Summarize long text |
| `translate` | Translate text to another language |

## Architecture

```
ai_cto/
├── agent.py           # Main agent loop with LLM-based decision making
├── planner.py         # Gemini-powered action planner
├── cli.py             # Typer CLI with chat, analyze, pr-review commands
├── config.py          # Configuration from environment variables
└── actions/
    ├── base.py        # Action abstract class and registry
    ├── registry.py    # Auto-registers all available actions
    ├── github.py      # GitHub API actions
    ├── devops.py      # CI/CD analysis actions
    └── tools.py       # General utility actions
```

### Agent Loop

1. Input task/goal
2. Ask LLM to choose action based on available tools
3. Execute action with context from previous steps
4. Store result
5. Repeat (max 8 steps) or mark as done

## Installation

### Prerequisites

- Python 3.11+
- GitHub Personal Access Token (for GitHub features)
- Google Gemini API Key

### Setup

```bash
# Clone and navigate to project
cd hackawar

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example ai_cto/.env

# Edit ai_cto/.env with your keys
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

## Usage

### Interactive Chat

```bash
./venv/bin/python -m ai_cto.cli chat
```

In chat mode:
- Type any question for general conversation
- `help` - Show available commands
- `clear` - Clear chat history
- `analyze owner/repo` - Analyze GitHub workflows
- `exit` - Quit

Example conversations:
```
You> Explain what this code does: def foo(x): return x * 2
You> Write a Python function to sort a list
You> What's the weather like today?
You> Translate "Hello world" to Spanish
```

### Analyze GitHub Repository

```bash
./venv/bin/python -m ai_cto.cli analyze owner/repo
```

Example:
```bash
./venv/bin/python -m ai_cto.cli analyze facebook/react
```

This will:
1. Fetch workflow files from `.github/workflows/`
2. Analyze for issues (no caching, repeated installs, no parallel jobs)
3. Generate AI-powered improvement suggestions

### PR Review

```bash
./venv/bin/python -m ai_cto.cli pr-review owner/repo 123
```

Options:
- `--message` - Custom message to post (optional, auto-generates if not provided)

## Configuration

Environment variables in `ai_cto/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GITHUB_TOKEN` | For GitHub features | GitHub Personal Access Token |
| `SEARCH_API_KEY` | No | For web search features |
| `SEARCH_ENGINE_ID` | No | Custom search engine ID |

## Development

### Adding New Actions

1. Create a new file in `ai_cto/actions/` (e.g., `new_actions.py`)
2. Define action classes extending `Action` from `base.py`
3. Import and register in `registry.py`:

```python
from ai_cto.actions.base import Action, ActionRegistry
from .new_actions import MyNewAction

ActionRegistry.register(MyNewAction)
```

Each action requires:
- `name` - Unique identifier
- `description` - What the action does
- `run(**kwargs)` - Execution logic returning a dict

## Dependencies

- `google-generativeai` - Gemini API
- `requests` - HTTP requests
- `typer` - CLI framework
- `pydantic` - Data validation
- `PyYAML` - YAML parsing
- `python-dotenv` - Environment variables

## License

MIT

## Example Output

### Chat Session

```
============================================================
  🤖 AI Assistant (type 'exit' to quit, 'help' for commands)
============================================================

You> Write a Python function to reverse a string

Assistant> Here's a simple Python function to reverse a string:

```python
def reverse_string(s):
    return s[::-1]
```

This uses Python's slice notation with a step of -1 to reverse the string.

You> analyze kubernetes/kubernetes
```

### Analysis Output

```
Starting AI Assistant for: Analyze CI/CD workflows for kubernetes/kubernetes and suggest improvements
==================================================

Step 1: fetch_workflows
Result: {'repo': 'kubernetes/kubernetes', 'workflows': [...]}

Step 2: analyze_workflows
Result: {'issues': [...]}

Step 3: suggest_improvements
Result: {'suggestions': [...]}

FINAL RESULTS

Suggestions:
  - Add caching for dependency installation
  - Run independent jobs in parallel
  - Use matrix strategy for test variations
  - Add workflow dependency caching
```
