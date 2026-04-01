# Pre-Deploy War Room

Pre-deployment risk analysis module with Slack briefings and Git pre-commit hook.

## Setup

```bash
npm install
cp .env.example .env
```

If the package is installed inside a Git repository, `npm install` will auto-install its `pre-commit` hook.

Example package install:

```bash
npm install pre-deploy-war-room
```

## CLI Tool (Pre-Commit Hook)

The hook installs automatically on `npm install`, but you can also manage it manually:

```bash
npm run hook -- install
```

Remove the hook:

```bash
npm run hook -- uninstall
```

Run analysis manually (without git hook):

```bash
npm run cli
```

## Risk Analysis

The CLI analyzes:
- Historical deploy failures for affected services
- Commit size (lines changed)
- Number of files modified
- Critical files (config, database, auth)
- Time of day (peak hours = higher risk)

Exit codes:
- `0` = Proceed with commit
- `1` = Block commit (HIGH risk)

## Web Server Mode

```bash
npm run dev    # Development
npm start      # Production
```

### Test

```bash
curl -X POST http://localhost:3001/webhook/deploy \
  -H "Content-Type: application/json" \
  -d '{"service":"auth-service","branch":"main","triggeredBy":"john","commitSha":"abc123"}'
```

### API Endpoints

- `POST /webhook/deploy` - Risk analysis and Slack briefing
- `POST /webhook/deploy-decision` - Slack button callbacks

## Risk Levels

- 🟢 LOW (0-35): Safe to commit/deploy
- 🟡 MEDIUM (36-65): Review before merge
- 🔴 HIGH (66-100): Blocked (CLI) / Consider delay (webhook)
