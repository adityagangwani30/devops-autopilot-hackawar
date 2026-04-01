#!/usr/bin/env node
"use strict";

/**
 * Unit tests for sentryParser and eventFilter.
 * No external dependencies — run with: node tests/unit.test.js
 */

// ─── Minimal test harness ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(a, b) {
  if (a !== b) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── Load modules ─────────────────────────────────────────────────────────────

// Set dummy env so config doesn't exit
process.env.SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "https://hooks.slack.com/test";
process.env.AGENT_ENDPOINT = process.env.AGENT_ENDPOINT || "http://localhost:4000/handle-error";

const { parseSentryPayload } = require("../pipeline-service/src/services/sentryParser");
const { shouldProcess } = require("../pipeline-service/src/services/eventFilter");

// ─── Parser tests ─────────────────────────────────────────────────────────────

console.log("\nsentryParser");

test("parses basic issue alert payload", () => {
  const payload = {
    action: "created",
    data: {
      issue: {
        id: "123",
        title: "TypeError: something broke",
        level: "error",
        culprit: "src/app.js in main",
        project: { slug: "my-project" },
        web_url: "https://sentry.io/issues/123",
      },
      event: {
        environment: "production",
        release: "v1.0.0",
        platform: "node",
        timestamp: "2024-01-01T00:00:00Z",
      },
    },
  };

  const result = parseSentryPayload(payload);

  assertEqual(result.id, "123");
  assertEqual(result.title, "TypeError: something broke");
  assertEqual(result.level, "error");
  assertEqual(result.project, "my-project");
  assertEqual(result.environment, "production");
  assertEqual(result.release, "v1.0.0");
  assertEqual(result.culprit, "src/app.js in main");
  assertEqual(result.url, "https://sentry.io/issues/123");
});

test("parses stack frames and extracts app frames", () => {
  const payload = {
    data: {
      issue: { id: "1", title: "Error", level: "error", project: { slug: "p" } },
      event: {
        exception: {
          values: [
            {
              type: "TypeError",
              value: "oops",
              stacktrace: {
                frames: [
                  { filename: "node_modules/x.js", function: "run", lineno: 1, in_app: false },
                  { filename: "src/foo.js", function: "doThing", lineno: 42, in_app: true },
                  { filename: "src/bar.js", function: "main", lineno: 10, in_app: true },
                ],
              },
            },
          ],
        },
      },
    },
  };

  const result = parseSentryPayload(payload);
  assertEqual(result.appFrames.length, 2);
  assert(result.appFrames[0].includes("src/foo.js:42"), "should include foo.js frame");
  assert(result.appFrames[1].includes("src/bar.js:10"), "should include bar.js frame");
});

test("parses array-style tags into object", () => {
  const payload = {
    data: {
      issue: { id: "1", title: "E", level: "error", project: { slug: "p" } },
      event: {
        tags: [
          ["environment", "staging"],
          ["release", "v2.0"],
        ],
      },
    },
  };

  const result = parseSentryPayload(payload);
  assertEqual(result.tags["environment"], "staging");
  assertEqual(result.tags["release"], "v2.0");
});

test("masks email address", () => {
  const payload = {
    data: {
      issue: { id: "1", title: "E", level: "error", project: { slug: "p" } },
      event: {
        user: { id: "u1", email: "alice@example.com" },
      },
    },
  };

  const result = parseSentryPayload(payload);
  assert(result.user.email.includes("***"), "email should be masked");
  assert(!result.user.email.includes("alice"), "full email should not be present");
});

test("redacts Authorization header", () => {
  const payload = {
    data: {
      issue: { id: "1", title: "E", level: "error", project: { slug: "p" } },
      event: {
        request: {
          url: "https://api.example.com/users",
          method: "GET",
          headers: {
            authorization: "Bearer super-secret-token",
            "content-type": "application/json",
          },
        },
      },
    },
  };

  const result = parseSentryPayload(payload);
  assertEqual(result.request.headers["authorization"], "[REDACTED]");
  assertEqual(result.request.headers["content-type"], "application/json");
});

test("throws on non-object payload", () => {
  let threw = false;
  try {
    parseSentryPayload("not an object");
  } catch {
    threw = true;
  }
  assert(threw, "should throw on string input");
});

test("falls back gracefully when data is missing", () => {
  const result = parseSentryPayload({ action: "created" });
  assert(result.title.length > 0, "title should have a fallback value");
});

// ─── Event filter tests ───────────────────────────────────────────────────────

console.log("\neventFilter");

// Reset config for filter tests
delete require.cache[require.resolve("../pipeline-service/src/config")];

test("allows error level by default", () => {
  process.env.ALLOWED_LEVELS = "error,fatal,critical";
  process.env.ALLOWED_ENVIRONMENTS = "";
  delete require.cache[require.resolve("../pipeline-service/src/config")];
  delete require.cache[require.resolve("../pipeline-service/src/services/eventFilter")];

  const { shouldProcess: sp } = require("../pipeline-service/src/services/eventFilter");
  assert(sp({ level: "error", environment: "production" }), "error should be processed");
  assert(sp({ level: "fatal", environment: "staging" }), "fatal should be processed");
  assert(!sp({ level: "warning", environment: "production" }), "warning should be filtered");
  assert(!sp({ level: "info", environment: "production" }), "info should be filtered");
});

test("environment filter restricts to allowed environments", () => {
  process.env.ALLOWED_LEVELS = "error,fatal";
  process.env.ALLOWED_ENVIRONMENTS = "production";
  delete require.cache[require.resolve("../pipeline-service/src/config")];
  delete require.cache[require.resolve("../pipeline-service/src/services/eventFilter")];

  const { shouldProcess: sp } = require("../pipeline-service/src/services/eventFilter");
  assert(sp({ level: "error", environment: "production" }), "production should be allowed");
  assert(!sp({ level: "error", environment: "staging" }), "staging should be filtered");
  assert(!sp({ level: "error", environment: "development" }), "dev should be filtered");
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(50)}`);
console.log(`Unit tests: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
