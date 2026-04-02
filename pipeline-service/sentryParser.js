"use strict";

/**
 * Parses a Sentry webhook payload into a normalized error object.
 *
 * Sentry sends slightly different shapes for:
 *   - Issue alerts  (data.issue + data.event)
 *   - Metric alerts (data.metric_alert)
 *   - Error alerts  (data.event only)
 *
 * This normalizer handles all three.
 */
function parseSentryPayload(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Payload must be a JSON object");
  }

  const issue = body.data?.issue || body.issue || {};
  const event = body.data?.event || body.event || {};
  const metricAlert = body.data?.metric_alert || {};

  // Stack frames from the first exception value
  const exceptionValues = event.exception?.values || [];
  const primaryException = exceptionValues[0] || {};
  const stackFrames = primaryException.stacktrace?.frames || [];

  // Tags as flat key→value object
  const tags = {};
  if (Array.isArray(event.tags)) {
    for (const [k, v] of event.tags) tags[k] = v;
  } else if (event.tags && typeof event.tags === "object") {
    Object.assign(tags, event.tags);
  }

  // Breadcrumbs (last 5 for context)
  const breadcrumbs = (event.breadcrumbs?.values || []).slice(-5);

  return {
    // Identity
    id: issue.id || event.event_id || metricAlert.id || `unknown_${Date.now()}`,
    fingerprint: event.fingerprint || [],

    // Classification
    title: issue.title || event.title || event.message || primaryException.value || "Unknown error",
    type: primaryException.type || event.type || "error",
    level: issue.level || event.level || "error",
    action: body.action,

    // Location
    project: issue.project?.slug || body.project || "unknown",
    environment: event.environment || issue.environment || tags.environment || "unknown",
    release: event.release || issue.firstRelease?.version || tags.release,
    url: issue.web_url || issue.url,

    // Timing
    timestamp: event.timestamp || issue.firstSeen,
    firstSeen: issue.firstSeen,
    lastSeen: issue.lastSeen,
    eventCount: issue.count,
    userCount: issue.userCount,

    // Code location
    culprit: issue.culprit || event.culprit,
    platform: event.platform || issue.platform,

    // Stack trace (full frames, top-most last)
    stackFrames: stackFrames.map((f) => ({
      filename: f.filename,
      function: f.function,
      lineno: f.lineno,
      colno: f.colno,
      context_line: f.context_line,
      in_app: f.in_app,
    })),

    // App frames only (most relevant for triage)
    appFrames: stackFrames
      .filter((f) => f.in_app)
      .map((f) => `${f.filename}:${f.lineno} in ${f.function || "<anonymous>"}`)
      .slice(-5),

    // Request context
    request: event.request
      ? {
          url: event.request.url,
          method: event.request.method,
          headers: sanitizeHeaders(event.request.headers || {}),
        }
      : null,

    // User context (anonymized)
    user: event.user
      ? {
          id: event.user.id,
          username: event.user.username,
          email: maskEmail(event.user.email),
          ip_address: maskIp(event.user.ip_address),
        }
      : null,

    // Extra context
    tags,
    breadcrumbs,
    extra: event.extra || {},
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeHeaders(headers) {
  const SENSITIVE = ["authorization", "cookie", "x-api-key", "x-auth-token"];
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = SENSITIVE.includes(k.toLowerCase()) ? "[REDACTED]" : v;
  }
  return out;
}

function maskEmail(email) {
  if (!email) return undefined;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local[0]}***@${domain}`;
}

function maskIp(ip) {
  if (!ip) return undefined;
  // Mask last octet: 192.168.1.42 → 192.168.1.xxx
  return ip.replace(/\.\d+$/, ".xxx");
}

module.exports = { parseSentryPayload };
