#!/usr/bin/env node
"use strict";

/**
 * Integration test — sends a realistic Sentry webhook payload to the pipeline
 * and verifies it processes without errors.
 *
 * Usage:
 *   node tests/integration.test.js
 *   PIPELINE_URL=https://your-domain.com node tests/integration.test.js
 */

const PIPELINE_URL = process.env.PIPELINE_URL || "http://localhost:3000";

const SAMPLE_PAYLOADS = {
  typeError: {
    action: "created",
    data: {
      issue: {
        id: "test-issue-001",
        title: "TypeError: Cannot read properties of undefined (reading 'id')",
        level: "error",
        culprit: "src/api/users.js in getUserById",
        count: 47,
        userCount: 12,
        firstSeen: new Date(Date.now() - 3600000).toISOString(),
        lastSeen: new Date().toISOString(),
        project: { slug: "my-backend" },
        web_url: "https://sentry.io/organizations/my-org/issues/test-issue-001/",
      },
      event: {
        event_id: "evt_test_001",
        level: "error",
        environment: "production",
        release: "v2.4.1",
        platform: "node",
        timestamp: new Date().toISOString(),
        exception: {
          values: [
            {
              type: "TypeError",
              value: "Cannot read properties of undefined (reading 'id')",
              stacktrace: {
                frames: [
                  {
                    filename: "node_modules/express/lib/router/index.js",
                    function: "next",
                    lineno: 284,
                    in_app: false,
                  },
                  {
                    filename: "src/middleware/auth.js",
                    function: "verifySession",
                    lineno: 38,
                    in_app: true,
                    context_line: "  const userId = session.user.id;",
                  },
                  {
                    filename: "src/api/users.js",
                    function: "getUserById",
                    lineno: 17,
                    in_app: true,
                    context_line: "  return db.users.find({ id: req.session.user.id });",
                  },
                ],
              },
            },
          ],
        },
        request: {
          url: "https://api.example.com/api/v1/users/profile",
          method: "GET",
          headers: { "user-agent": "Mozilla/5.0", authorization: "Bearer [REDACTED]" },
        },
        user: { id: "u_abc123", email: "j***@example.com" },
        tags: [
          ["environment", "production"],
          ["release", "v2.4.1"],
          ["server_name", "web-prod-3"],
        ],
      },
    },
  },

  dbError: {
    action: "created",
    data: {
      issue: {
        id: "test-issue-002",
        title: "Error: connect ECONNREFUSED 127.0.0.1:5432",
        level: "fatal",
        culprit: "src/db/pool.js in createConnection",
        count: 203,
        userCount: 89,
        project: { slug: "my-backend" },
        web_url: "https://sentry.io/organizations/my-org/issues/test-issue-002/",
      },
      event: {
        event_id: "evt_test_002",
        level: "fatal",
        environment: "production",
        platform: "node",
        timestamp: new Date().toISOString(),
        exception: {
          values: [
            {
              type: "Error",
              value: "connect ECONNREFUSED 127.0.0.1:5432",
              stacktrace: {
                frames: [
                  {
                    filename: "src/db/pool.js",
                    function: "createConnection",
                    lineno: 22,
                    in_app: true,
                    context_line: "  await pool.connect();",
                  },
                ],
              },
            },
          ],
        },
        tags: [["environment", "production"]],
      },
    },
  },
};

async function runTest(name, payload) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Test: ${name}`);
  console.log(`${"─".repeat(60)}`);

  const url = `${PIPELINE_URL}/webhook/sentry`;
  console.log(`POST ${url}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(body, null, 2));

    if (res.status === 200) {
      console.log("✅ PASSED");
      return true;
    } else {
      console.log("❌ FAILED — unexpected status");
      return false;
    }
  } catch (err) {
    console.error(`❌ FAILED — ${err.message}`);
    console.error("  Is the pipeline service running? (npm start in pipeline-service/)");
    return false;
  }
}

async function runHealthCheck() {
  console.log(`\nChecking pipeline health at ${PIPELINE_URL}/health ...`);
  try {
    const res = await fetch(`${PIPELINE_URL}/health`);
    const body = await res.json();
    console.log("Health:", JSON.stringify(body, null, 2));
    return true;
  } catch (err) {
    console.error(`Health check failed: ${err.message}`);
    return false;
  }
}

(async () => {
  console.log("Sentry → Agent → Slack Pipeline — Integration Tests");
  console.log(`Target: ${PIPELINE_URL}`);

  const healthy = await runHealthCheck();
  if (!healthy) {
    console.error("\nAborting — pipeline service is not reachable.");
    process.exit(1);
  }

  const results = await Promise.all([
    runTest("TypeError (production error)", SAMPLE_PAYLOADS.typeError),
    runTest("DB connection failure (fatal)", SAMPLE_PAYLOADS.dbError),
  ]);

  const passed = results.filter(Boolean).length;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Results: ${passed}/${results.length} tests passed`);
  console.log("Check your Slack channel for the notifications!");
  console.log(`${"═".repeat(60)}\n`);

  process.exit(passed === results.length ? 0 : 1);
})();
