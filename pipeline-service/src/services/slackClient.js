"use strict";

const { CONFIG } = require("../config");
const { logger } = require("../utils/logger");

const LEVEL_EMOJI = {
  fatal: "💀",
  critical: "🔴",
  error: "🚨",
  warning: "⚠️",
  info: "ℹ️",
  debug: "🐛",
};

const LEVEL_COLOR = {
  fatal: "#7b0000",
  critical: "#d00000",
  error: "#e63946",
  warning: "#f4a261",
  info: "#457b9d",
  debug: "#6c757d",
};

/**
 * Sends a formatted Slack Block Kit notification.
 *
 * @param {object} opts
 * @param {string} opts.requestId
 * @param {object} opts.error        - parsed Sentry error
 * @param {string|null} opts.agentSummary
 * @param {boolean} opts.agentFailed
 * @param {string|null} opts.agentErrorMessage
 */
async function sendSlackNotification({ requestId, error, agentSummary, agentFailed, agentErrorMessage }) {
  if (!CONFIG.SLACK_WEBHOOK_URL) {
    logger.warn("SLACK_WEBHOOK_URL not configured — skipping Slack notification");
    return;
  }

  const emoji = LEVEL_EMOJI[error.level] || "🚨";
  const color = LEVEL_COLOR[error.level] || "#e63946";

  const agentSection = buildAgentSection(agentSummary, agentFailed, agentErrorMessage);
  const stackSection = buildStackSection(error.appFrames);
  const metaFields = buildMetaFields(error);

  const payload = {
    channel: CONFIG.SLACK_CHANNEL,
    attachments: [
      {
        color,
        blocks: [
          // Header
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${emoji} Sentry Error — ${error.level.toUpperCase()}`,
              emoji: true,
            },
          },
          // Error title
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${escapeSlack(error.title)}*`,
            },
          },
          { type: "divider" },
          // Metadata fields
          {
            type: "section",
            fields: metaFields,
          },
          // App frames (if any)
          ...(stackSection ? [stackSection] : []),
          { type: "divider" },
          // Agent analysis
          agentSection,
          // Action buttons
          ...(error.url
            ? [
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "View in Sentry →", emoji: true },
                      url: error.url,
                      style: "danger",
                    },
                  ],
                },
              ]
            : []),
          // Footer
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Request ID: \`${requestId}\` • ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.SLACK_TIMEOUT_MS);

  try {
    const response = await fetch(CONFIG.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Slack API error ${response.status}: ${text}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Block builders ───────────────────────────────────────────────────────────

function buildMetaFields(error) {
  const fields = [
    { type: "mrkdwn", text: `*Project*\n\`${error.project}\`` },
    { type: "mrkdwn", text: `*Environment*\n\`${error.environment}\`` },
    { type: "mrkdwn", text: `*Level*\n\`${error.level}\`` },
    { type: "mrkdwn", text: `*Platform*\n\`${error.platform || "unknown"}\`` },
  ];

  if (error.release) {
    fields.push({ type: "mrkdwn", text: `*Release*\n\`${error.release}\`` });
  }
  if (error.culprit) {
    fields.push({ type: "mrkdwn", text: `*Culprit*\n\`${error.culprit}\`` });
  }
  if (error.eventCount) {
    fields.push({ type: "mrkdwn", text: `*Occurrences*\n${error.eventCount}` });
  }
  if (error.userCount) {
    fields.push({ type: "mrkdwn", text: `*Users Affected*\n${error.userCount}` });
  }

  return fields;
}

function buildStackSection(appFrames) {
  if (!appFrames || appFrames.length === 0) return null;
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Stack (app frames)*\n\`\`\`${appFrames.join("\n")}\`\`\``,
    },
  };
}

function buildAgentSection(summary, failed, errorMessage) {
  if (failed) {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Agent Analysis*\n⚠️ Agent failed to respond: \`${errorMessage || "unknown error"}\``,
      },
    };
  }
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Agent Analysis*\n${summary || "_No analysis returned_"}`,
    },
  };
}

function escapeSlack(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { sendSlackNotification };
