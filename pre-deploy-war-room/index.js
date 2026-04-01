require('dotenv').config();

const express = require('express');
const { analyzeRisk } = require('./riskAnalyzer');
const { sendDeployBriefing } = require('./slackNotifier');
const { handleDecision } = require('./decisionHandler');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/webhook/deploy', async (req, res) => {
  try {
    const { service, branch, triggeredBy, commitSha } = req.body;

    if (!service || !branch || !triggeredBy || !commitSha) {
      return res.status(400).json({ error: 'Missing required payload fields' });
    }

    console.log(`[${new Date().toISOString()}] Deploy triggered: ${service}/${branch} by ${triggeredBy}`);

    const riskResult = await analyzeRisk(req.body);

    console.log(`Risk analysis: ${riskResult.level} (${riskResult.score}/100)`);

    await sendDeployBriefing(service, branch, triggeredBy, commitSha, riskResult);

    res.json({
      success: true,
      message: 'Deploy briefing sent to Slack',
      risk: riskResult
    });
  } catch (error) {
    console.error('Deploy webhook error:', error.message);
    res.status(500).json({ error: 'Failed to process deploy webhook' });
  }
});

app.post('/webhook/deploy-decision', handleDecision);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pre-deploy-war-room' });
});

app.listen(PORT, () => {
  console.log(`Pre-Deploy War Room listening on port ${PORT}`);
});

module.exports = app;
