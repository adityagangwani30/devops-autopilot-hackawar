# Sentry → Agent → Slack Pipeline

A production-ready middleware pipeline that receives Sentry error webhooks, routes them through an AI agent for analysis, and posts rich Slack notifications — all with retry logic, signature verification, event filtering, and graceful error handling.

```
┌─────────────┐     webhook      ┌──────────────────┐     POST      ┌───────────────┐
│   Sentry    │ ───────────────▶ │ Pipeline Service │ ────────────▶ │ Agent Service │
│  (error     │  POST /webhook   │   (port 3000)    │  /handle-     │  (port 4000)  │
│  detected)  │  /sentry         │                  │   error       │               │
└─────────────┘                  └────────┬─────────┘               └───────┬───────┘
                                          │                                  │
                                          │  { summary: "..." }              │
                                          │ ◀────────────────────────────────┘
                                          │
                                          │  Slack Block Kit message
                                          ▼
                                  ┌───────────────┐
                                  │     Slack     │
                                  │  #alerts      │
                                  └───────────────┘
```

---

## Project Structure

```
sentry-pipeline/
├── pipeline-service/          # Webhook receiver + orchestrator
│   ├── src/
│   │   ├── server.js          # Express app entry point
│   │   ├── config.js          # Env vars + validation
│   │   ├── routes/
│   │   │   ├── webhook.js     # POST /webhook/sentry handler
│   │   │   └── health.js      # GET /health handler
│   │   ├── services/
│   │   │   ├── sentryVerifier.js  # HMAC-SHA256 signature check
│   │   │   ├── sentryParser.js    # Normalizes Sentry payload shapes
│   │   │   ├── eventFilter.js     # Level + environment filtering
│   │   │   ├── agentClient.js     # HTTP client with retry logic
│   │   │   └── slackClient.js     # Slack Block Kit formatter + sender
│   │   ├── middleware/
│   │   │   ├── requestLogger.js
│   │   │   └── errorHandler.js
│   │   └── utils/logger.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── agent-service/             # AI error analyzer
│   ├── src/
│   │   ├── server.js          # Express app entry point
│   │   ├── analyzer.js        # Claude LLM + rule-based fallback
│   │   ├── middleware/auth.js  # Optional Bearer token auth
│   │   └── utils/logger.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── tests/
│   ├── unit.test.js           # Parser + filter unit tests (no deps)
│   └── integration.test.js    # End-to-end webhook tests
│
├── docker-compose.yml
└── .env.example               # Root env for Docker Compose
```

---

## Prerequisites

- **Node.js 18+** — uses native `fetch` (no node-fetch needed)
- **npm**
- A **Sentry** account (sentry.io or self-hosted)
- A **Slack** workspace where you can create apps
- An **Anthropic API key** (only if using LLM mode — get one at console.anthropic.com)

---

## Step 1 — Clone and Install

```bash
# Install pipeline service dependencies
cd pipeline-service
npm install

# Install agent service dependencies
cd ../agent-service
npm install

cd ..
```

---

## Step 2 — Create a Slack Incoming Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App → From scratch**
2. Give it a name (e.g. `Sentry Alerts`) and pick your workspace
3. In the left sidebar, click **Incoming Webhooks** and toggle it **On**
4. Click **Add New Webhook to Workspace**, choose your alert channel (e.g. `#alerts`), and click **Allow**
5. Copy the **Webhook URL** — it looks like `https://hooks.slack.com/services/T.../B.../xxx`

You'll put this in the `SLACK_WEBHOOK_URL` env var in the next step.

---

## Step 3 — Configure the Pipeline Service

```bash
cd pipeline-service
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port the service listens on | No (default 3000) |
| `SENTRY_WEBHOOK_SECRET` | HMAC secret from Sentry (Step 5) | No (skip in local dev) |
| `AGENT_ENDPOINT` | URL of your agent service | Yes |
| `AGENT_API_KEY` | Shared secret for agent auth | No |
| `SLACK_WEBHOOK_URL` | From Step 2 | Yes |
| `SLACK_CHANNEL` | Slack channel name | No (default `#alerts`) |
| `ALLOWED_LEVELS` | Comma-separated levels to process | No (default `error,fatal,critical`) |
| `ALLOWED_ENVIRONMENTS` | Comma-separated envs to process | No (empty = all) |

---

## Step 4 — Configure the Agent Service

```bash
cd agent-service
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `AGENT_PORT` | Port this service listens on | No (default 4000) |
| `AGENT_MODE` | `llm` or `rule` | No (default `llm`) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Only if `AGENT_MODE=llm` |
| `AGENT_API_KEY` | Shared secret for auth | No |

**Agent modes:**

- `llm` — Uses Claude to write a plain-English diagnosis of the error, including likely root cause and suggested next steps. Requires `ANTHROPIC_API_KEY`.
- `rule` — Uses pattern matching (TypeError, ECONNREFUSED, DB errors, etc.) to generate a deterministic summary. No API key needed — great for testing or free-tier use.

---

## Step 5 — Configure Sentry Webhook

### On sentry.io

1. In your Sentry project, go to **Settings → Integrations → WebHooks**
2. Click **Add Webhook**, paste in your service URL:
   - Local dev: use ngrok (see Step 6 below) — e.g. `https://abc123.ngrok.io/webhook/sentry`
   - Production: `https://your-domain.com/webhook/sentry`
3. Under **Enabled Events**, check **Issue** (to get `action: created` events)
4. Click **Save Changes**, then click **Test** to send a sample event

**To get the webhook secret** (needed for signature verification in production):

1. Go to **Settings → Developer Settings → Internal Integrations**
2. Create an integration or click your existing webhook
3. Find the **Client Secret** — this is your `SENTRY_WEBHOOK_SECRET`

> You can leave `SENTRY_WEBHOOK_SECRET` blank during local development — the service will warn but still work.

### On self-hosted Sentry

Same flow — **Settings → Integrations → Webhooks** within your project.

---

## Step 6 — Run Locally

Open **two terminal windows**:

**Terminal 1 — Agent service:**
```bash
cd agent-service
npm start
# Or in rule-based mode (no API key needed):
npm run start:rule
```

You should see:
```
[INFO ] [agent] Agent service listening on port 4000
[INFO ] [agent] Mode: llm
```

**Terminal 2 — Pipeline service:**
```bash
cd pipeline-service
npm start
```

You should see:
```
[INFO ] Pipeline service listening on port 3000
[INFO ] Webhook endpoint: POST http://localhost:3000/webhook/sentry
[INFO ] Health check:     GET  http://localhost:3000/health
```

**Verify both services are up:**
```bash
curl http://localhost:3000/health
curl http://localhost:4000/health
```

### Expose to Sentry with ngrok (local dev)

Sentry needs a public HTTPS URL to send webhooks to. Use ngrok:

```bash
# Install: https://ngrok.com/download
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL and paste it into your Sentry webhook config as:
`https://xxxx.ngrok.io/webhook/sentry`

---

## Step 7 — Test the Pipeline

**Option A — Run the integration test:**
```bash
node tests/integration.test.js
```

This sends two realistic Sentry payloads (a TypeError and a DB connection failure) to your local pipeline and prints results. Check your Slack channel for the notification.

**Option B — Send a raw curl request:**
```bash
curl -X POST http://localhost:3000/webhook/sentry \
  -H "Content-Type: application/json" \
  -d '{
    "action": "created",
    "data": {
      "issue": {
        "id": "test-001",
        "title": "TypeError: Cannot read properties of undefined (reading '\''id'\'')",
        "level": "error",
        "culprit": "src/api/users.js in getUserById",
        "count": 47,
        "userCount": 12,
        "project": { "slug": "my-backend" },
        "web_url": "https://sentry.io/issues/test-001"
      },
      "event": {
        "environment": "production",
        "release": "v2.4.1",
        "platform": "node"
      }
    }
  }'
```

Expected response: `{"status":"received","requestId":"req_..."}` — then check Slack.

**Option C — Run unit tests (no services needed):**
```bash
node tests/unit.test.js
```

---

## Step 8 — Deploy to Production

### Option A: Docker Compose (recommended)

```bash
# From the project root
cp .env.example .env
# Fill in all values in .env

docker compose up -d

# Tail logs
docker compose logs -f

# Check health
curl https://your-domain.com/health
```

### Option B: Deploy services separately (Railway, Render, Fly.io, etc.)

Each service (`pipeline-service/` and `agent-service/`) is a self-contained Node.js app. Deploy them as separate services on your platform of choice and set the environment variables via the platform's secrets UI.

**Important for production:**
- Put the pipeline service behind a reverse proxy (nginx, Caddy, Traefik) with TLS — Sentry requires HTTPS
- Set `NODE_ENV=production` — this makes config errors fatal (process exits on startup)
- Set `SENTRY_WEBHOOK_SECRET` — without it, anyone who knows your URL can trigger alerts
- Set `ALLOWED_ENVIRONMENTS=production` — so staging/dev noise doesn't flood your channel

---

## Filtering Events

By default the pipeline processes `error`, `fatal`, and `critical` level events from any environment. You can restrict this:

**In `pipeline-service/.env`:**
```bash
# Only page for fatal/critical
ALLOWED_LEVELS=fatal,critical

# Only from production
ALLOWED_ENVIRONMENTS=production

# Both together: only fatal/critical from production
ALLOWED_LEVELS=fatal,critical
ALLOWED_ENVIRONMENTS=production
```

---

## Customizing the Agent

Open `agent-service/src/analyzer.js`. The `analyzeError(error)` function is the single place to plug in your own logic. The pipeline calls it with a normalized error object and expects a string summary back.

**The error object your agent receives:**

```javascript
{
  id:           "sentry-issue-id",
  title:        "TypeError: Cannot read properties of undefined",
  type:         "TypeError",
  level:        "error",           // fatal | critical | error | warning | info
  project:      "my-backend",
  environment:  "production",
  release:      "v2.4.1",
  culprit:      "src/api/users.js in getUserById",
  platform:     "node",
  url:          "https://sentry.io/issues/...",  // link back to Sentry
  timestamp:    "2024-01-01T00:00:00Z",
  eventCount:   47,
  userCount:    12,
  appFrames:    [                   // in-app stack frames only, formatted
    "src/middleware/auth.js:38 in verifySession",
    "src/api/users.js:17 in getUserById"
  ],
  stackFrames:  [ /* full frame objects */ ],
  request:      { url, method, headers },  // sanitized (auth headers redacted)
  user:         { id, username, email },   // email + IP masked
  tags:         { environment: "production", release: "v2.4.1" },
  breadcrumbs:  [ /* last 5 breadcrumbs */ ],
}
```

**Ideas for extending the agent:**
- Query a vector database for similar past issues
- Look up which team owns the service from a CODEOWNERS file or service catalog
- Trigger a PagerDuty incident for fatal errors
- Post a GitHub issue automatically
- Run a remediation playbook (restart a pod, clear a cache, etc.)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Pipeline returns 401 | Sentry signature mismatch | Re-copy `SENTRY_WEBHOOK_SECRET` from Sentry exactly; or clear it for local dev |
| No Slack message | Wrong webhook URL or channel | Test with `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"test"}'` |
| Agent not reachable | Wrong `AGENT_ENDPOINT` | Confirm agent is running and the URL is correct |
| `fetch is not defined` | Node.js < 18 | Run `node --version` and upgrade |
| Sentry not sending | URL not HTTPS or not reachable | Use ngrok locally; check Sentry's webhook delivery log |
| LLM mode returning rule-based result | `ANTHROPIC_API_KEY` not set | Add your key to `agent-service/.env` |
| All events filtered | `ALLOWED_ENVIRONMENTS` set to production but testing locally | Set `ALLOWED_ENVIRONMENTS=` (empty) or add your env to the list |

---

## Environment Variable Reference (Complete)

### Pipeline Service

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `production` makes startup errors fatal |
| `SENTRY_WEBHOOK_SECRET` | _(empty)_ | HMAC secret; empty = skip verification |
| `AGENT_ENDPOINT` | `http://localhost:4000/handle-error` | Agent URL |
| `AGENT_API_KEY` | _(empty)_ | Bearer token for agent auth |
| `AGENT_TIMEOUT_MS` | `15000` | Agent request timeout |
| `SLACK_WEBHOOK_URL` | _(required)_ | Slack Incoming Webhook URL |
| `SLACK_CHANNEL` | `#alerts` | Target channel |
| `SLACK_TIMEOUT_MS` | `5000` | Slack request timeout |
| `ALLOWED_LEVELS` | `error,fatal,critical` | Levels to process |
| `ALLOWED_ENVIRONMENTS` | _(empty = all)_ | Environments to process |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug` |

### Agent Service

| Variable | Default | Description |
|---|---|---|
| `AGENT_PORT` | `4000` | HTTP port |
| `AGENT_MODE` | `llm` | `llm` or `rule` |
| `ANTHROPIC_API_KEY` | _(required for llm mode)_ | Anthropic API key |
| `AGENT_API_KEY` | _(empty)_ | Bearer token (must match pipeline's `AGENT_API_KEY`) |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug` |
