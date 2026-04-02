"use strict";

const { CONFIG } = require("../config");

/**
 * Returns true if this error should be processed through the pipeline.
 *
 * Controlled by env vars:
 *   ALLOWED_ENVIRONMENTS=production,staging  (empty = allow all)
 *   ALLOWED_LEVELS=error,fatal,critical      (default)
 */
function shouldProcess(error) {
  // Environment filter
  if (CONFIG.ALLOWED_ENVIRONMENTS.length > 0) {
    if (!CONFIG.ALLOWED_ENVIRONMENTS.includes(error.environment)) {
      return false;
    }
  }

  // Level filter
  if (CONFIG.ALLOWED_LEVELS.length > 0) {
    if (!CONFIG.ALLOWED_LEVELS.includes(error.level)) {
      return false;
    }
  }

  return true;
}

module.exports = { shouldProcess };
