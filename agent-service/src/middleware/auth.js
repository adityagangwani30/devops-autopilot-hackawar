"use strict";

const AGENT_API_KEY = process.env.AGENT_API_KEY || "";

function authMiddleware(req, res, next) {
  // Skip auth for health check
  if (req.path === "/health") return next();

  // If no key is configured, allow all requests
  if (!AGENT_API_KEY) return next();

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (token !== AGENT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = { authMiddleware };
