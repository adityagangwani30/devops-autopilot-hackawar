const { sendConfirmation } = require('./slackNotifier');

async function handleDecision(req, res) {
  try {
    const { decision, service, commitSha } = req.body;

    if (!decision || !service || !commitSha) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Decision received: ${decision} for ${service} (${commitSha})`);

    await sendConfirmation(decision, service, commitSha);

    res.json({
      success: true,
      message: `Decision '${decision}' logged and confirmed for ${service}`
    });
  } catch (error) {
    console.error('Decision handler error:', error.message);
    res.status(500).json({ error: 'Failed to process decision' });
  }
}

module.exports = { handleDecision };

