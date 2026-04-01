"use strict";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function format(level, message) {
  return `[${new Date().toISOString()}] [${level.toUpperCase().padEnd(5)}] ${message}`;
}

const logger = {
  error: (msg) => currentLevel >= LEVELS.error && console.error(format("error", msg)),
  warn:  (msg) => currentLevel >= LEVELS.warn  && console.warn(format("warn", msg)),
  info:  (msg) => currentLevel >= LEVELS.info  && console.log(format("info", msg)),
  debug: (msg) => currentLevel >= LEVELS.debug && console.log(format("debug", msg)),
};

module.exports = { logger };
