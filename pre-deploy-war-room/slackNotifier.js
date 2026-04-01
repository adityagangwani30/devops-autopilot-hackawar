const { IncomingWebhook } = require('@slack/webhook');

let webhook;

function getWebhook() {
  if (!webhook) {
    webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
  }
  return webhook;
}

function getRiskEmoji(level) {
  const map = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴' };
  return map[level] || '⚪';
}

function formatBlocks(service, branch, triggeredBy, commitSha, riskResult) {
  const { score, level, reasons, recommendation } = riskResult;
  const emoji = getRiskEmoji(level);

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `⚡ Pre-Deploy War Room — ${service} (${branch})` }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Risk Level:* ${emoji} ${level}` },
        { type: 'mrkdwn', text: `*Risk Score:* ${score}/100` }
      ]
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Triggered By:* ${triggeredBy}` },
        { type: 'mrkdwn', text: `*Commit:* \`${commitSha}\`` }
      ]
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Risk Factors:*\n${reasons.map(r => `• ${r}`).join('\n')}` }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Recommendation:* ${recommendation}` }
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Deploy Anyway' },
          style: 'primary',
          value: JSON.stringify({ decision: 'deploy', service, commitSha })
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Delay 2hrs' },
          style: 'warning',
          value: JSON.stringify({ decision: 'delay', service, commitSha })
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Abort' },
          style: 'danger',
          value: JSON.stringify({ decision: 'abort', service, commitSha })
        }
      ]
    }
  ];
}

async function sendDeployBriefing(service, branch, triggeredBy, commitSha, riskResult) {
  try {
    const webhook = getWebhook();
    const blocks = formatBlocks(service, branch, triggeredBy, commitSha, riskResult);

    await webhook.send({
      text: `Pre-Deploy War Room briefing for ${service}`,
      blocks
    });

    return { success: true };
  } catch (error) {
    console.error('Slack notification failed:', error.message);
    throw error;
  }
}

async function sendConfirmation(decision, service, commitSha) {
  const messages = {
    deploy: `🚀 Deploy proceeding for ${service}`,
    delay: `⏱ Deploy for ${service} scheduled in 2 hours`,
    abort: `🛑 Deploy aborted for ${service}`
  };

  try {
    const webhook = getWebhook();
    await webhook.send({
      text: messages[decision],
      blocks: [{
        type: 'section',
        text: { type: 'mrkdwn', text: messages[decision] }
      }]
    });
    return { success: true };
  } catch (error) {
    console.error('Slack confirmation failed:', error.message);
    throw error;
  }
}

module.exports = { sendDeployBriefing, sendConfirmation };
