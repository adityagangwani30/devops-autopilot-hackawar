"use strict";

const express = require("express");
const { CONFIG } = require("../config");

const router = express.Router();
const startTime = Date.now();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    environment: CONFIG.NODE_ENV,
    config: {
      agent_endpoint: CONFIG.AGENT_ENDPOINT,
      slack_configured: !!CONFIG.SLACK_WEBHOOK_URL,
      sentry_secret_configured: !!CONFIG.SENTRY_WEBHOOK_SECRET,
      allowed_levels: CONFIG.ALLOWED_LEVELS,
      allowed_environments: CONFIG.ALLOWED_ENVIRONMENTS.length
        ? CONFIG.ALLOWED_ENVIRONMENTS
        : "all",
    },
  });
});

module.exports = { healthRouter: router };
