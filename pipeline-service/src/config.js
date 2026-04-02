"use strict";

const { logger } = require("./utils/logger");

const CONFIG = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Sentry
  SENTRY_WEBHOOK_SECRET: process.env.SENTRY_WEBHOOK_SECRET || "",

  // Agent
  AGENT_ENDPOINT: process.env.AGENT_ENDPOINT || "http://localhost:4000/handle-error",
  AGENT_API_KEY: process.env.AGENT_API_KEY || "",
  AGENT_TIMEOUT_MS: parseInt(process.env.AGENT_TIMEOUT_MS || "15000", 10),

  // Slack
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || "",
  SLACK_CHANNEL: process.env.SLACK_CHANNEL || "#alerts",
  SLACK_TIMEOUT_MS: parseInt(process.env.SLACK_TIMEOUT_MS || "5000", 10),

  // Filtering
  ALLOWED_ENVIRONMENTS: process.env.ALLOWED_ENVIRONMENTS
    ? process.env.ALLOWED_ENVIRONMENTS.split(",").map((e) => e.trim())
    : [], // empty = allow all
  ALLOWED_LEVELS: process.env.ALLOWED_LEVELS
    ? process.env.ALLOWED_LEVELS.split(",").map((l) => l.trim())
    : ["error", "fatal", "critical"],
};

function validateEnv() {
  const warnings = [];
  const errors = [];

  if (!CONFIG.SENTRY_WEBHOOK_SECRET) {
    warnings.push("SENTRY_WEBHOOK_SECRET not set — signature verification disabled (OK for local dev)");
  }
  if (!CONFIG.SLACK_WEBHOOK_URL) {
    errors.push("SLACK_WEBHOOK_URL is required");
  }
  if (!CONFIG.AGENT_ENDPOINT) {
    errors.push("AGENT_ENDPOINT is required");
  }

  warnings.forEach((w) => logger.warn(`[Config] ${w}`));

  if (errors.length > 0) {
    errors.forEach((e) => logger.error(`[Config] ${e}`));
    if (CONFIG.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

module.exports = { CONFIG, validateEnv };
