"use strict";

require("dotenv").config();
const express = require("express");
const { analyzeError } = require("./analyzer");
const { authMiddleware } = require("./middleware/auth");
const { logger } = require("./utils/logger");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Optional API key auth
app.use(authMiddleware);

/**
 * POST /handle-error
 *
 * Receives a parsed Sentry error from the pipeline service.
 * Returns { summary: "..." } with an AI-generated analysis.
 */
app.post("/handle-error", async (req, res) => {
  const { error } = req.body;

  if (!error || !error.title) {
    return res.status(400).json({ error: "Missing required field: error.title" });
  }

  logger.info(`Analyzing: "${error.title}" [${error.level}] in ${error.project}`);

  try {
    const summary = await analyzeError(error);
    logger.info("Analysis complete");
    res.json({ summary });
  } catch (err) {
    logger.error(`Analysis failed: ${err.message}`);
    res.status(500).json({ error: "Analysis failed", detail: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: process.env.AGENT_MODE || "llm",
    llm_configured: !!process.env.ANTHROPIC_API_KEY,
  });
});

const PORT = process.env.AGENT_PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Agent service listening on port ${PORT}`);
  logger.info(`Mode: ${process.env.AGENT_MODE || "llm"}`);
});
