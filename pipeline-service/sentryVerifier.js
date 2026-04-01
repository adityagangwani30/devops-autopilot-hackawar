"use strict";

const crypto = require("crypto");
const { CONFIG } = require("../config");
const { logger } = require("../utils/logger");

/**
 * Verifies the Sentry webhook HMAC-SHA256 signature.
 *
 * Sentry sends:  sentry-hook-signature: <sha256 hex digest>
 * We compute:    HMAC-SHA256(secret, rawBody) and compare.
 *
 * If no secret is configured, verification is skipped (dev mode).
 */
function verifySentrySignature(req) {
  if (!CONFIG.SENTRY_WEBHOOK_SECRET) {
    logger.warn("Signature verification skipped — SENTRY_WEBHOOK_SECRET not set");
    return true;
  }

  const signature = req.headers["sentry-hook-signature"];
  if (!signature) {
    logger.warn("Missing sentry-hook-signature header");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", CONFIG.SENTRY_WEBHOOK_SECRET);
    // req.body is already parsed JSON; re-stringify for consistent hashing
    hmac.update(JSON.stringify(req.body));
    const digest = hmac.digest("hex");

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== digest.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(digest, "utf8")
    );
  } catch (err) {
    logger.error(`Signature verification error: ${err.message}`);
    return false;
  }
}

module.exports = { verifySentrySignature };
