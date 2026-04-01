"use strict";

const { logger } = require("./utils/logger");

const MODE = process.env.AGENT_MODE || "llm"; // "llm" | "rule"

/**
 * Main entrypoint: analyzes a parsed Sentry error and returns a Slack-ready summary.
 *
 * Modes:
 *   llm  — calls Claude via Anthropic API (requires ANTHROPIC_API_KEY)
 *   rule — deterministic rule-based fallback (no API key needed, good for testing)
 */
async function analyzeError(error) {
  if (MODE === "rule") {
    return ruleBasedAnalysis(error);
  }
  return llmAnalysis(error);
}

// ─── LLM Analysis (Claude via Anthropic API) ──────────────────────────────────

async function llmAnalysis(error) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn("ANTHROPIC_API_KEY not set — falling back to rule-based analysis");
    return ruleBasedAnalysis(error);
  }

  const prompt = buildPrompt(error);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.content?.[0];

  if (!content || content.type !== "text") {
    throw new Error("Unexpected response shape from Anthropic API");
  }

  return content.text.trim();
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert software engineer on an on-call team.
You receive parsed Sentry error payloads and write concise Slack alert summaries.

Your output must:
- Be under 280 characters (fits a Slack section block cleanly)
- Lead with the most likely root cause
- Include 1-2 actionable next steps
- Be plain text, no markdown headers, no bullet points
- Never mention Sentry or "the error" — get straight to the diagnosis

Example good output:
"Null reference in getUserById() — userId is undefined when session expires before the DB call. Check session expiry logic in auth middleware and add null guard before the DB query."`;

function buildPrompt(error) {
  const parts = [
    `Error: ${error.title}`,
    `Level: ${error.level}`,
    `Project: ${error.project}`,
    `Environment: ${error.environment}`,
  ];

  if (error.culprit) parts.push(`Culprit: ${error.culprit}`);
  if (error.release) parts.push(`Release: ${error.release}`);

  if (error.appFrames && error.appFrames.length > 0) {
    parts.push(`App stack frames:\n${error.appFrames.join("\n")}`);
  }

  if (error.request) {
    parts.push(`Request: ${error.request.method} ${error.request.url}`);
  }

  if (error.tags && Object.keys(error.tags).length > 0) {
    const tagStr = Object.entries(error.tags)
      .slice(0, 5)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    parts.push(`Tags: ${tagStr}`);
  }

  if (error.eventCount) parts.push(`Occurrence count: ${error.eventCount}`);
  if (error.userCount) parts.push(`Users affected: ${error.userCount}`);

  return parts.join("\n");
}

// ─── Rule-based Fallback ──────────────────────────────────────────────────────

function ruleBasedAnalysis(error) {
  const title = error.title || "";
  const culprit = error.culprit ? `in \`${error.culprit}\`` : "";
  const env = error.environment || "unknown";
  const count = error.eventCount ? ` (${error.eventCount} occurrences)` : "";
  const users = error.userCount ? `, ${error.userCount} users affected` : "";

  const diagnosis = matchPattern(title);

  const lines = [
    `*${diagnosis.label}* ${culprit}`,
    diagnosis.action,
    `Environment: \`${env}\`${count}${users}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return lines;
}

const PATTERNS = [
  {
    match: /cannot read prop|cannot read properties|undefined is not/i,
    label: "Null/undefined dereference",
    action: "Add null checks or optional chaining before property access.",
  },
  {
    match: /typeerror/i,
    label: "Type error",
    action: "Check argument types and API contract at the call site.",
  },
  {
    match: /ECONNREFUSED|ECONNRESET|ETIMEDOUT|connect timeout/i,
    label: "Network/connection failure",
    action: "Check downstream service health and circuit-breaker config.",
  },
  {
    match: /ENOENT|no such file/i,
    label: "Missing file",
    action: "Verify file paths and that required assets are deployed.",
  },
  {
    match: /out of memory|heap limit|memory limit/i,
    label: "Out of memory",
    action: "Profile heap usage; consider increasing container memory or fixing leaks.",
  },
  {
    match: /database|pg |mysql|mongo|sequelize|prisma/i,
    label: "Database error",
    action: "Check DB connection pool, query syntax, and schema migrations.",
  },
  {
    match: /rate limit|too many requests|429/i,
    label: "Rate limit hit",
    action: "Back off and retry with exponential backoff; review throttling strategy.",
  },
  {
    match: /auth|unauthorized|forbidden|403|401/i,
    label: "Auth/permission error",
    action: "Verify credentials, token expiry, and IAM permissions.",
  },
  {
    match: /syntax error|unexpected token|json parse/i,
    label: "Parse/syntax error",
    action: "Check the input data format and upstream data contract.",
  },
];

function matchPattern(title) {
  for (const pattern of PATTERNS) {
    if (pattern.match.test(title)) {
      return { label: pattern.label, action: pattern.action };
    }
  }
  return {
    label: "Unclassified error",
    action: "Review the stack trace and recent deployments for root cause.",
  };
}

module.exports = { analyzeError };
