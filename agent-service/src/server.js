"use strict";

require("dotenv").config();
const express = require("express");
const { analyzeError } = require("./analyzer");
const { authMiddleware } = require("./middleware/auth");
const { logger } = require("./utils/logger");

const app = express();
const PORT = process.env.AGENT_PORT || 4000;
const MODE = process.env.AGENT_MODE || "llm";

app.use(express.json({ limit: "1mb" }));
app.use(authMiddleware);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MODE,
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Main endpoint — receives parsed error from pipeline
app.post("/handle-error", async (req, res) => {
  const { error } = req.body;

  if (!error) {
    return res.status(400).json({ error: "Missing 'error' in request body" });
  }

  try {
    logger.info(`Analyzing: "${error.title}" [${error.level}]`);
    const summary = await analyzeError(error);
    logger.info(`Analysis complete (${summary.length} chars)`);
    res.json({ summary });
  } catch (err) {
    logger.error(`Analysis failed: ${err.message}`);
    res.status(500).json({ error: "Analysis failed", detail: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

const server = app.listen(PORT, () => {
  logger.info(`Agent service listening on port ${PORT}`);
  logger.info(`Mode: ${MODE}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down...");
  server.close(() => process.exit(0));
});

module.exports = { app };
