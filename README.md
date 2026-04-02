# DevOps Autopilot

An AI-powered autonomous DevOps agent that monitors your pipeline, diagnoses issues, and takes action — with your approval.

## Project Overview

DevOps Autopilot is an intelligent monitoring and automation system designed to replace reactive incident response with proactive issue prevention. It leverages AI to continuously observe your CI/CD pipeline, analyze errors, and provide actionable recommendations.

### Core Loop: Observe → Reason → Act

1. **Observe** — Continuously monitors CI/CD events, git commits, deploy triggers, and infrastructure metrics in real-time
2. **Reason** — Analyzes blast radius, evaluates risk scores, cross-references past failures, and decides the best course of action
3. **Act** — Proposes fixes, pushes back on risky deploys, or auto-remediates — always with human-in-the-loop approval

### Key Features

- **AI Assistant** — Get instant answers to infrastructure questions in plain language
- **Infrastructure Knowledge Graph** — Real-time visualization of connected services and dependencies
- **Pre-Deploy War Room** — Collaborative go/no-go decision engine before deployments
- **GitHub Integration** — Automatic PR-incident linking and commit-level impact analysis
- **Repository Syncing** — Real-time visibility into commits, branches, PRs, and deployments
- **Real-Time Metrics** — CPU, memory, disk I/O, and network monitoring with historical trends

### Five Core Capabilities

1. **Instant Diagnosis** — Root cause identification immediately when pipeline fails
2. **Fix with Approval** — Agent proposes fixes, shows diffs, waits for approval
3. **Risk Detection** — Flags high blast radius, failing tests, or config drift
4. **Cost Tracking** — Real-time ROI quantification (SLA penalties avoided, downtime prevented)
5. **Natural Language Queries** — Ask questions like "Why did the auth service fail?"

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DevOps Autopilot Pipeline                         │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────┐     ┌─────────────────┐     ┌──────────────┐
     │ Sentry   │────▶│ Pipeline Service │────▶│ Agent Service │
     │ Webhook  │     │  (Port 3000)      │     │  (Port 4000)  │
     └──────────┘     └────────┬─────────┘     └──────┬───────┘
                               │                        │
                               │              ┌─────────┴─────────┐
                               │              │                   │
                               ▼              ▼                   ▼
                        ┌─────────────┐  ┌─────────┐         ┌───────────┐
                        │   Filter    │  │  LLM    │         │   Rule    │
                        │ (env/level) │  │ (Claude)│         │  Based    │
                        └─────────────┘  └────┬────┘         └───────────┘
                                               │
                                               ▼
                                ┌────────────────────────┐
                                │    Slack Notification   │
                                │     (#alerts channel)   │
                                └─────────────────────────┘

Data Flow:
1. Sentry sends webhook → pipeline-service receives at POST /webhook/sentry
2. Signature verified → payload parsed → event filtered by env/level
3. Error sent to agent-service → analysis via Claude API (or rule fallback)
4. Slack notification sent with error + AI analysis
```

---

## Full File Tree

### Root
```
.env.example              # Environment variable template
.env                      # Local environment (gitignored)
.gitignore
README.md
requirements.txt          # Python dependencies
```

### `frontend/` — Next.js Landing Page
```
frontend/
├── app/
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── dashboard/         # Dashboard routes
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── loading.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── knowledge-graph/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/[...all]/
│   │   │   └── route.ts
│   │   └── chat/
│   │       └── route.ts
├── components/            # React components
│   ├── navigation.tsx
│   ├── hero-section.tsx
│   ├── problem-section.tsx
│   ├── solution-section.tsx
│   ├── feature-cards-deck.tsx
│   ├── chatbot-section.tsx
│   ├── chatbot-widget.tsx
│   ├── knowledge-graph.tsx
│   ├── pre-deploy-war-room.tsx
│   ├── github-integration.tsx
│   ├── repository-syncing.tsx
│   ├── real-time-metrics.tsx
│   ├── team-section.tsx
│   ├── footer.tsx
│   ├── prism.tsx
│   ├── prism-background.tsx
│   └── ui/                # Radix UI components
├── lib/                   # Utilities
│   ├── auth-client.ts
│   ├── auth-session.ts
│   ├── dashboard-queries.ts
│   └── use-session.ts
├── scripts/
│   └── init-db.ts
├── public/
│   └── images/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

### `pipeline-service/` — Sentry Webhook Receiver
```
pipeline-service/
├── src/
│   ├── server.js          # Express entry point
│   ├── config.js         # Environment config & validation
│   ├── analyzer.js       # (legacy, unused)
│   ├── auth.js           # (legacy, unused)
│   ├── errorHandler.js   # (legacy, unused)
│   ├── requestLogger.js  # (legacy, unused)
│   ├── webhook.js        # (legacy, unused)
│   ├── logger.js         # (legacy, unused)
│   ├── sentryVerifier.js # (legacy, unused)
│   ├── sentryParser.js   # (legacy, unused)
│   ├── slackClient.js    # (legacy, unused)
│   ├── routes/
│   │   ├── webhook.js    # POST /webhook/sentry
│   │   └── health.js     # GET /health
│   ├── services/
│   │   ├── sentryVerifier.js  # HMAC signature verification
│   │   ├── sentryParser.js    # Payload parsing
│   │   ├── eventFilter.js     # Environment/level filtering
│   │   ├── agentClient.js     # Agent service HTTP client
│   │   └── slackClient.js     # Slack Block Kit notifications
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   └── utils/
│       └── logger.js
├── package.json
├── unit.test.js           # Parser & filter tests
├── integration.test.js    # End-to-end tests
└── README.md
```

### `agent-service/` — AI Error Analyzer
```
agent-service/
├── src/
│   ├── server.js          # Express entry point
│   ├── analyzer.js        # LLM + rule-based analysis
│   ├── middleware/
│   │   └── auth.js        # API key authentication
│   └── utils/
│       └── logger.js
├── package.json
└── .env                   # ANTHROPIC_API_KEY
```

### `github-integration/` — GitHub PR Bot
```
github-integration/
├── src/
│   ├── server.ts          # Express + TypeScript
│   ├── webhook.ts        # GitHub webhook handler
│   ├── github.ts         # Octokit client
│   ├── analyzer.ts       # Pipeline YAML analyzer
│   ├── ai-comment-generator.ts  # Claude-powered comments
│   ├── commenter.ts      # PR comment posting
│   └── pr-comment.ts    # Comment formatting
├── package.json
├── tsconfig.json
└── README.md
```

### `pre-deploy-war-room/` — Pre-Deploy Risk Analysis
```
pre-deploy-war-room/
├── index.js               # Express server
├── cli.js                # CLI for manual runs
├── riskAnalyzer.js       # Risk scoring engine
├── slackNotifier.js      # Slack war room notifications
├── decisionHandler.js    # Go/no-go decisions
├── deployHistory.json    # Deployment history storage
├── package.json
├── README.md
└── bin/
    └── war-room.js       # Executable entry point
```

### `ai_cto/` — AI CTO Agent (Python)
```
ai_cto/
├── server.py             # FastAPI server
├── cli.py                # CLI interface
├── agent.py              # Agent orchestration
├── planner.py            # Task planning
├── llm.py                # LLM client
├── config.py             # Configuration
├── utils.py              # Utilities
├── chat_service.py      # Chat handling
├── chat_runner.py       # Chat CLI
├── local_runner.py      # Local testing
├── knowledge_graph_tools.py
├── analysis_pipeline.py
├── actions/              # Tool actions
│   ├── base.py
│   ├── tools.py
│   ├── registry.py
│   ├── github.py
│   ├── devops.py
│   └── knowledge_graph.py
├── .env.example
└── .env
```

### `cost_advisor_module/` — AWS Cost Advisor (Python)
```
cost_advisor_module/
├── main.py               # FastAPI entry
├── service.py            # Cost analysis service
├── config.py             # Configuration
├── models.py             # Pydantic models
├── test_advisor.py       # Tests
├── repo_cost_metrics.json
├── README.md
└── __init__.py
```

### `core/` — Core Utilities (Python)
```
core/
├── utils/
│   └── __init__.py
├── monitoring/
│   │   ├── __init__.py
│   │   └── log_analyzer.py
├── models/
│   └── __init__.py
├── aws/
│   ├── __init__.py
│   └── cost_optimizer.py
├── dashboard/
│   ├── __init__.py
│   └── api.py
├── api/
│   └── main.py
├── graph_orchestrator.py
└── __init__.py
```

### `tests/` — Integration Tests
```
tests/
├── unit.test.js
└── integration.test.js
```

---

## Prerequisites

### Software Versions
- **Node.js** — v18+ (v20+ recommended)
- **npm** — v9+
- **Python** — 3.10+
- **pip** — 23+

### Required Accounts & Services
| Service | Purpose | Key Needed |
|---------|---------|------------|
| Sentry | Error monitoring | `SENTRY_WEBHOOK_SECRET` |
| Slack | Notifications | `SLACK_WEBHOOK_URL` |
| Anthropic | AI analysis | `ANTHROPIC_API_KEY` |
| GitHub | PR integration | `GITHUB_TOKEN`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Neo4j (optional) | Knowledge graph | `NEO4J_URI`, `NEO4J_PASSWORD` |
| Better Auth | User auth | `BETTER_AUTH_SECRET` |
| Vercel | Hosting frontend | (auto-configured) |

---

## Windows Setup

### 1. Clone and Install Dependencies

```powershell
# Clone the repository
git clone https://github.com/yourorg/devops-autopilot.git
cd devops-autopilot

# Install root Python dependencies
pip install -r requirements.txt

# Install pipeline-service dependencies
cd pipeline-service
npm install

# Install agent-service dependencies
cd ../agent-service
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install pre-deploy-war-room dependencies
cd ../pre-deploy-war-room
npm install

# Install github-integration dependencies
cd ../github-integration
npm install

# Install ai_cto Python dependencies (in venv recommended)
cd ../ai_cto
pip install -r requirements.txt
```

### 2. Install Pre-Requisites (if needed)

```powershell
# Install Node.js from https://nodejs.org/
# Install Python from https://www.python.org/

# Verify installations
node --version   # Should show v18+
npm --version    # Should show v9+
python --version # Should show 3.10+
```

---

## Environment Variables

### Root `.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Auth encryption key |
| `BETTER_AUTH_URL` | Yes | Auth server URL |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth secret |
| `NEO4J_URI` | No | Neo4j connection URI |
| `NEO4J_USER` | No | Neo4j username |
| `NEO4J_PASSWORD` | No | Neo4j password |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `GITHUB_TOKEN` | Yes | GitHub personal access token |

### `pipeline-service/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `SENTRY_WEBHOOK_SECRET` | No | — | Sentry HMAC secret |
| `AGENT_ENDPOINT` | Yes | http://localhost:4000/handle-error | Agent service URL |
| `AGENT_API_KEY` | No | — | Agent auth key |
| `AGENT_TIMEOUT_MS` | No | 15000 | Agent timeout (ms) |
| `SLACK_WEBHOOK_URL` | Yes | — | Slack webhook URL |
| `SLACK_CHANNEL` | No | #alerts | Slack channel |
| `SLACK_TIMEOUT_MS` | No | 5000 | Slack timeout (ms) |
| `ALLOWED_ENVIRONMENTS` | No | (all) | Comma-separated envs |
| `ALLOWED_LEVELS` | No | error,fatal,critical | Comma-separated levels |

### `agent-service/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AGENT_PORT` | No | 4000 | Server port |
| `AGENT_MODE` | No | llm | "llm" or "rule" |
| `ANTHROPIC_API_KEY` | No | — | Claude API key |

---

## Running Locally

### Option 1: Run Individual Services

```powershell
# Terminal 1: Pipeline Service
cd pipeline-service
npm run dev
# Listening on http://localhost:3000

# Terminal 2: Agent Service
cd agent-service
npm run dev
# Listening on http://localhost:4000

# Terminal 3: Frontend (optional)
cd frontend
npm run dev
# Accessible at http://localhost:3000
```

### Option 2: Run Pre-Deploy War Room

```powershell
cd pre-deploy-war-room
npm run cli
# Or as a service:
npm start
# Express server on port 3001
```

### Option 3: Run AI CTO Agent

```powershell
cd ai_cto
python server.py
# FastAPI server on port 8000
```

---

## Agent Modes

The agent service supports two modes, controlled by `AGENT_MODE`:

### LLM Mode (default)
- Uses Anthropic's Claude API for intelligent analysis
- Generates natural language diagnoses under 280 characters
- Includes root cause + actionable next steps
- Requires `ANTHROPIC_API_KEY`

### Rule Mode
- Deterministic pattern matching (no API key needed)
- Matches error titles against known patterns
- Good for testing and fallback
- Run with: `npm run start:rule`

---

## Event Filtering

Two environment variables control which Sentry events pass through the pipeline:

### `ALLOWED_LEVELS`
- **Default:** `error,fatal,critical`
- **Purpose:** Only process these severity levels
- **Example:** `ALLOWED_LEVELS=error,fatal,critical,warning`

### `ALLOWED_ENVIRONMENTS`
- **Default:** (empty = allow all)
- **Purpose:** Only process events from specific environments
- **Example:** `ALLOWED_ENVIRONMENTS=production,staging`

Events outside these filters return HTTP 200 with `{ status: "filtered" }`.

---

## Testing

### Unit Tests (Pipeline Service)

```powershell
cd pipeline-service
node unit.test.js
```

Expected output:
```
══════════════════════════════════════════════════
sentryParser
  ✅ parses basic issue alert payload
  ✅ parses stack frames and extracts app frames
  ✅ parses array-style tags into object
  ✅ masks email address
  ✅ redaction Authorization header
  ✅ throws on non-object payload
  ✅ falls back gracefully when data is missing

eventFilter
  ✅ allows error level by default
  ✅ environment filter restricts to allowed environments
══════════════════════════════════════════════════
Unit tests: 9 passed, 0 failed
```

### Integration Tests

```powershell
# Test the full webhook flow
cd pipeline-service
node integration.test.js
```

### Frontend Tests

```powershell
cd frontend
npm run build    # TypeScript check + build
npm run typecheck # Just type checking
```

---

## Deployment

### Docker (Recommended)

```dockerfile
# pipeline-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t devops-autopilot/pipeline-service pipeline-service/
docker run -p 3000:3000 --env-file pipeline-service/.env devops-autopilot/pipeline-service
```

### Manual Deployment

1. **Pipeline Service** — Deploy to any Node.js host (Railway, Render, VPS)
2. **Agent Service** — Same as above, on separate port
3. **Frontend** — Deploy to Vercel (automatic)
4. **Sentry** — Configure webhook URL to your pipeline service
5. **Slack** — Create incoming webhook, paste URL to env

### Sentry Webhook Configuration

In Sentry:
1. Settings → Integrations → Webhooks
2. Add webhook URL: `https://your-domain.com/webhook/sentry`
3. Set "Security" header to your `SENTRY_WEBHOOK_SECRET`
4. Configure "Let events be re-triggered" for reliability

---

## Customizing the Agent

### Error Object Shape

The pipeline sends this object to the agent:

```javascript
{
  id: "123",
  title: "TypeError: Cannot read property 'x' of undefined",
  level: "error",
  project: "my-project",
  environment: "production",
  release: "v1.0.0",
  culprit: "src/api/users.js in getUser",
  platform: "node",
  url: "https://sentry.io/issues/123",
  eventCount: 150,
  userCount: 23,
  appFrames: [
    "src/api/users.js:42:15 in getUser",
    "src/middleware/auth.js:10:8 in authenticate"
  ],
  request: {
    method: "GET",
    url: "/api/users/123",
    headers: { "content-type": "application/json" }
  },
  tags: { environment: "production", release: "v1.0.0" }
}
```

### Custom Rule Patterns

Add patterns to `agent-service/src/analyzer.js`:

```javascript
{
  match: /your-pattern/i,
  label: "Your Label",
  action: "Your recommended action."
}
```

---

## Troubleshooting

| Failure Mode | Symptom | Solution |
|--------------|---------|----------|
| Signature verification failed | 401 error from Sentry | Check `SENTRY_WEBHOOK_SECRET` matches Sentry settings |
| Slack notification not sent | No message in channel | Verify `SLACK_WEBHOOK_URL` is valid |
| Agent returns 500 | Analysis fails | Check `ANTHROPIC_API_KEY` is set, or use rule mode |
| Events filtered | HTTP 200 but no notification | Check `ALLOWED_LEVELS` and `ALLOWED_ENVIRONMENTS` |
| Agent timeout | Long delay then error | Increase `AGENT_TIMEOUT_MS` |
| Port already in use | Error EADDRINUSE | Kill process on port or change PORT env var |
| Mongo/Neo4j connection fails | Warning on startup | Set env vars or ignore if not required |

---

## License

MIT
