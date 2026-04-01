const fs = require('fs').promises;
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'deployHistory.json');

async function getRecentFailures(service, daysBack = 7) {
  const data = await fs.readFile(HISTORY_FILE, 'utf-8');
  const history = JSON.parse(data);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  return history.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entry.service === service &&
           entryDate >= cutoff &&
           entry.status === 'failed';
  });
}

function getCurrentMetrics() {
  return {
    cpu: Math.floor(Math.random() * 51) + 40,
    memory: Math.floor(Math.random() * 51) + 40
  };
}

function getTimeOfDayScore(hourIST) {
  if (hourIST >= 9 && hourIST <= 11) return 25;
  if (hourIST >= 14 && hourIST <= 17) return 20;
  return 0;
}

function getOpenPRsCount() {
  return Math.floor(Math.random() * 4);
}

function calculateScore(failures, metrics, hourIST, openPRs) {
  let score = 0;

  score += Math.min(failures.length * 15, 45);

  const avgMetric = (metrics.cpu + metrics.memory) / 2;
  score += Math.floor((avgMetric - 40) / 5) * 5;

  score += getTimeOfDayScore(hourIST);

  score += openPRs * 5;

  return Math.min(Math.max(score, 0), 100);
}

function getRiskLevel(score) {
  if (score <= 35) return 'LOW';
  if (score <= 65) return 'MEDIUM';
  return 'HIGH';
}

function getReasons(failures, metrics, hourIST, openPRs) {
  const reasons = [];

  if (failures.length > 0) {
    reasons.push(`${failures.length} failure(s) in the last 7 days for ${failures[0].service}`);
  }

  if (metrics.cpu > 70 || metrics.memory > 70) {
    reasons.push(`High resource usage: CPU ${metrics.cpu}%, Memory ${metrics.memory}%`);
  }

  if ((hourIST >= 9 && hourIST <= 11) || (hourIST >= 14 && hourIST <= 17)) {
    reasons.push(`Peak hours (IST): ${hourIST}:00`);
  }

  if (openPRs > 0) {
    reasons.push(`${openPRs} open PR(s) pending for this service`);
  }

  return reasons.length > 0 ? reasons : ['No significant risk factors detected'];
}

function getRecommendation(score, hourIST) {
  if (score > 65) return 'Consider deploying after 6 PM when traffic drops';
  if (hourIST >= 9 && hourIST <= 11) return 'Deploy after morning peak (after 11 AM)';
  if (hourIST >= 14 && hourIST <= 17) return 'Deploy after evening peak (after 5 PM)';
  return 'Safe to deploy now';
}

async function analyzeRisk(payload) {
  const { service } = payload;

  const failures = await getRecentFailures(service);
  const metrics = getCurrentMetrics();
  const hourIST = new Date().getHours();
  const openPRs = getOpenPRsCount();

  const score = calculateScore(failures, metrics, hourIST, openPRs);
  const level = getRiskLevel(score);
  const reasons = getReasons(failures, metrics, hourIST, openPRs);
  const recommendation = getRecommendation(score, hourIST);

  return {
    score,
    level,
    reasons,
    recommendation
  };
}

module.exports = { analyzeRisk, calculateScore, getRiskLevel };
