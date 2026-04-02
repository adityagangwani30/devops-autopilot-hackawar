"use strict";

const { CONFIG } = require("../config");
const { logger } = require("../utils/logger");

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Calls the agent service with the parsed error payload.
 * Returns the agent's summary string.
 *
 * Retries up to MAX_RETRIES times on transient failures (5xx, network errors).
 */
async function callAgent(error) {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "sentry-pipeline/1.0",
  };

  if (CONFIG.AGENT_API_KEY) {
    headers["Authorization"] = `Bearer ${CONFIG.AGENT_API_KEY}`;
  }

  const body = JSON.stringify({ error });

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.AGENT_TIMEOUT_MS);

      const response = await fetch(CONFIG.AGENT_ENDPOINT, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new AgentError(
          `Agent returned HTTP ${response.status}: ${text.slice(0, 200)}`,
          response.status,
          isRetryable(response.status)
        );
      }

      const data = await response.json();
      const summary = data.summary || data.message || data.analysis;

      if (!summary) {
        logger.warn("Agent response had no summary/message/analysis field");
        return "_Agent returned no summary_";
      }

      return summary;
    } catch (err) {
      lastError = err;
      const retryable = err instanceof AgentError ? err.retryable : true; // network errors are retryable

      if (!retryable || attempt > MAX_RETRIES) break;

      logger.warn(`Agent call attempt ${attempt} failed (${err.message}), retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError;
}

function isRetryable(status) {
  return status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AgentError extends Error {
  constructor(message, statusCode, retryable) {
    super(message);
    this.name = "AgentError";
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

module.exports = { callAgent };
