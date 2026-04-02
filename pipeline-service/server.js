"use strict";

require("dotenv").config();
const express = require("express");
const { validateEnv } = require("./config");
const { webhookRouter } = require("./routes/webhook");
const { healthRouter } = require("./routes/health");
const { logger } = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");
const { requestLogger } = require("./middleware/requestLogger");

validateEnv();

const app = express();

// Parse JSON — Sentry sends application/json
app.use(express.json({ limit: "1mb" }));

// Request logging
app.use(requestLogger);

// Routes
app.use("/webhook", webhookRouter);
app.use("/health", healthRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Pipeline service listening on port ${PORT}`);
  logger.info(`Webhook endpoint: POST http://localhost:${PORT}/webhook/sentry`);
  logger.info(`Health check:     GET  http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  server.close(() => process.exit(0));
});

module.exports = { app };
