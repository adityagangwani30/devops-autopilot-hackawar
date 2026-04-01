# GitHub CI/CD Optimization Bot

A lightweight GitHub bot that automatically reviews CI/CD workflows on pull requests and suggests optimizations.

## Features

- Listens to GitHub pull request events via webhooks
- Analyzes GitHub Actions workflow files for common optimization opportunities
- Posts constructive comments with suggestions for improvement
- No auto-merging or PR creation - only provides suggestions
- Rule-based analysis (no ML/AI required)

## Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- GitHub Personal Access Token with `repo` and `workflow` scopes
- A publicly accessible URL for GitHub to send webhooks to (use ngrok for local testing)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your GitHub Personal Access Token:
   ```
   GITHUB_TOKEN=your_github_token_here
   PORT=3000
   ```

### Running Locally

1. Start the bot:
   ```bash
   npm run dev
   ```

2. Expose your local server to the internet using ngrok:
   ```bash
   ngrok http 3000
   ```

3. Note the HTTPS URL that ngrok provides (e.g., `https://abc123.ngrok.io`)

### Setting Up GitHub Webhook

1. Go to your GitHub repository
2. Navigate to Settings → Webhooks → Add webhook
3. Set the Payload URL to your ngrok URL plus `/webhook` (e.g., `https://abc123.ngrok.io/webhook`)
4. Set Content type to `application/json`
5. Under "Which events would you like to trigger this webhook?", select:
   - Pull requests
6. Click "Add webhook"

### Deployment

For production deployment, you can deploy this to any Node.js hosting service:

#### Using Docker (optional)

1. Build the Docker image:
   ```bash
   docker build -t github-ci-bot .
   ```

2. Run the container:
   ```bash
   docker run -d -p 3000:3000 --env-file .env github-ci-bot
   ```

#### Manual Deployment

1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

### How It Works

1. When a pull request is opened or updated, GitHub sends a webhook to your server
2. The bot fetches the workflow files (`.github/workflows/*.yml`) from the PR branch
3. It analyzes each workflow for optimization opportunities:
   - Missing dependency caching (`actions/cache`)
   - Reinstalling dependencies every run
   - Lack of parallel job execution
   - Missing matrix strategies for testing
   - Long install steps without caching
   - Non-optimized runner specifications
4. Suggestions are formatted into a markdown comment and posted to the PR
5. The bot avoids duplicate comments by checking for recent bot comments and updating them instead

### Customization

You can modify the analysis rules in `src/analyzer.ts` to add or adjust optimization suggestions based on your team's practices.

## License

MIT