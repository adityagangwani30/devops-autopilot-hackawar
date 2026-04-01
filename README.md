# DevOps Autopilot

Hackathon-ready repo with a static frontend and an optional backend GitHub integration service.

## Structure

```text
frontend/                   Next.js static site
backend/github-integration/ Optional webhook service for GitHub PR analysis
scripts/                    Root helper scripts
```

## Commands

Run these from the repo root: `d:\Hack-A-War\devops-autopilot-hackawar`

- `npm run setup`
  Installs dependencies for both the frontend and backend.
- `npm run dev`
  Starts the frontend in development mode.
- `npm run build:frontend`
  Creates a production static export in `frontend/out`.
- `npm start`
  Serves the static frontend build from `frontend/out` on `http://localhost:3000`.
- `npm run dev:backend`
  Starts the GitHub integration service in development mode.
- `npm run build:backend`
  Compiles the backend service to `backend/github-integration/dist`.
- `npm run typecheck`
  Runs frontend and backend TypeScript checks.

## Fastest Way To Run The Website

1. `npm run setup`
2. `npm run build:frontend`
3. `npm start`

That gives you a production-like static site without using `npm run dev`.

## Backend Notes

The GitHub integration service is optional for viewing the website. If you want to run it:

1. Copy `backend/github-integration/.env.example` to `backend/github-integration/.env`
2. Add your GitHub token
3. Run `npm run dev:backend`
