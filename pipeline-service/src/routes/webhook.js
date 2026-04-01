"use strict";

const express = require("express");
const { verifySentrySignature } = require("../services/sentryVerifier");
const { parseSentryPayload } = require("../services/sentryParser");
const { shouldProcess } = require("../services/eventFilter");
const { callAgent } = require("../services/agentClient");
const { sendSlackNotification } = require("../services/slackClient");
const { logger } = require("../utils/logger");

const router = express.Router();

router.post("/sentry", async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  logger.info(`[${requestId}] Sentry webhook received`);

  // 1. Verify Sentry HMAC signature
  if (!verifySentrySignature(req)) {
    logger.warn(`[${requestId}] Signature verification failed`);
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 2. Parse the payload
  let error;
  try {
    error = parseSentryPayload(req.body);
  } catch (parseErr) {
    logger.error(`[${requestId}] Failed to parse Sentry payload: ${parseErr.message}`);
    return res.status(400).json({ error: "Invalid payload", detail: parseErr.message });
  }

  // 3. Check action type — only process new/triggered errors
  const action = req.body.action;
  if (action && !["created", "triggered"].includes(action)) {
    logger.info(`[${requestId}] Skipping — action="${action}"`);
    return res.status(200).json({ status: "ignored", reason: `action=${action}` });
  }

  // 4. Apply environment/level filters
  if (!shouldProcess(error)) {
    logger.info(`[${requestId}] Filtered out — level="${error.level}" env="${error.environment}"`);
    return res.status(200).json({ status: "filtered" });
  }

  logger.info(`[${requestId}] Processing: "${error.title}" [${error.level}] in ${error.project}`);

  // 5. ACK Sentry immediately — Sentry retries if we take too long
  res.status(200).json({ status: "received", requestId });

  // 6. Run the pipeline asynchronously
  setImmediate(() => runPipeline(requestId, error));
});

async function runPipeline(requestId, error) {
  let agentSummary = null;
  let agentError = null;

  // Step A: Call the agent
  try {
    logger.info(`[${requestId}] Calling agent...`);
    agentSummary = await callAgent(error);
    logger.info(`[${requestId}] Agent responded successfully`);
  } catch (err) {
    agentError = err;
    logger.error(`[${requestId}] Agent call failed: ${err.message}`);
  }

  // Step B: Send Slack notification (always, even if agent failed)
  try {
    await sendSlackNotification({
      requestId,
      error,
      agentSummary,
      agentFailed: agentError !== null,
      agentErrorMessage: agentError?.message,
    });
    logger.info(`[${requestId}] Slack notification sent`);
  } catch (slackErr) {
    logger.error(`[${requestId}] Slack notification failed: ${slackErr.message}`);
  }
}

module.exports = { webhookRouter: router };
