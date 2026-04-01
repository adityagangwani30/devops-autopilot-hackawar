#!/usr/bin/env node

const { execSync } = require('child_process');

const riskAnalyzer = require('./riskAnalyzer');

const EXIT_CODES = { PROCEED: 0, BLOCK: 1, SKIP: 0 };

function loadSlackNotifier() {
  try {
    return require('./slackNotifier');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('@slack/webhook')) {
      return null;
    }

    throw error;
  }
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const author = execSync('git log -1 --format="%an"', { encoding: 'utf-8' })
      .trim()
      .replace(/"/g, '');

    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    const diffStats = execSync('git diff --cached --numstat', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    let linesAdded = 0;
    let linesDeleted = 0;

    diffStats.forEach((line) => {
      const [add, del] = line.split('\t');
      linesAdded += parseInt(add, 10) || 0;
      linesDeleted += parseInt(del, 10) || 0;
    });

    const changedServices = detectServices(stagedFiles);

    return {
      branch,
      commitSha,
      author,
      stagedFiles,
      linesAdded,
      linesDeleted,
      changedServices
    };
  } catch (error) {
    console.error('Failed to get git info:', error.message);
    process.exit(EXIT_CODES.BLOCK);
  }
}

function detectServices(files) {
  const serviceMap = {
    auth: 'auth-service',
    api: 'api-gateway',
    payment: 'payment-service',
    user: 'user-service',
    notification: 'notification-service'
  };

  const services = new Set();

  files.forEach((file) => {
    const lower = file.toLowerCase();

    for (const [key, service] of Object.entries(serviceMap)) {
      if (lower.includes(key)) {
        services.add(service);
      }
    }
  });

  return services.size > 0 ? Array.from(services) : ['unknown-service'];
}

function calculateCommitRisk(gitInfo, historicalFailures) {
  let score = 0;
  const reasons = [];

  score += Math.min(historicalFailures.length * 15, 45);
  if (historicalFailures.length > 0) {
    reasons.push(`${historicalFailures.length} deploy failure(s) for ${gitInfo.changedServices[0]}`);
  }

  const totalChanges = gitInfo.linesAdded + gitInfo.linesDeleted;
  if (totalChanges > 500) {
    score += 25;
    reasons.push(`Large commit: ${totalChanges} lines changed`);
  } else if (totalChanges > 200) {
    score += 10;
    reasons.push(`Medium commit: ${totalChanges} lines changed`);
  }

  if (gitInfo.stagedFiles.length > 15) {
    score += 15;
    reasons.push(`Many files changed: ${gitInfo.stagedFiles.length} files`);
  }

  const hourIST = new Date().getHours();
  if ((hourIST >= 9 && hourIST <= 11) || (hourIST >= 14 && hourIST <= 17)) {
    score += 20;
    reasons.push(`Peak hours (IST): ${hourIST}:00`);
  }

  const criticalFiles = gitInfo.stagedFiles.filter(
    (file) => file.includes('config') || file.includes('database') || file.includes('auth')
  );
  if (criticalFiles.length > 0) {
    score += 15;
    reasons.push(`Critical files modified: ${criticalFiles.join(', ')}`);
  }

  const level = score <= 35 ? 'LOW' : score <= 65 ? 'MEDIUM' : 'HIGH';
  const recommendation = score > 65
    ? 'Consider reviewing changes carefully'
    : score > 35
      ? 'Review before merge'
      : 'Safe to commit';

  return { score: Math.min(score, 100), level, reasons, recommendation };
}

function printRiskReport(gitInfo, risk) {
  const ansi = { LOW: '\x1b[32m', MEDIUM: '\x1b[33m', HIGH: '\x1b[31m', RESET: '\x1b[0m' };

  console.log('\n==============================================');
  console.log(' PRE-COMMIT WAR ROOM - RISK ANALYSIS');
  console.log('==============================================');
  console.log(`${ansi[risk.level]}Risk Level: ${risk.level}${ansi.RESET}`);
  console.log(`Score: ${risk.score}/100`);
  console.log(`Branch: ${gitInfo.branch}`);
  console.log(`Commit: ${gitInfo.commitSha}`);
  console.log(`Author: ${gitInfo.author}`);
  console.log(`Files: ${gitInfo.stagedFiles.length}`);
  console.log(`Changes: +${gitInfo.linesAdded} -${gitInfo.linesDeleted}`);

  if (risk.reasons.length > 0) {
    console.log('Risk Factors:');
    risk.reasons.forEach((reason) => {
      console.log(`- ${reason}`);
    });
  }

  console.log(`Recommendation: ${risk.recommendation}`);
  console.log('==============================================\n');
}

async function runPreCommitHook() {
  console.log('Running Pre-Commit War Room...\n');

  const gitInfo = getGitInfo();
  console.log(`Analyzing commit on branch: ${gitInfo.branch}`);
  console.log(`Files to commit: ${gitInfo.stagedFiles.length}`);
  console.log(`Changed services: ${gitInfo.changedServices.join(', ')}`);

  const primaryService = gitInfo.changedServices[0] || 'unknown-service';
  const failures = await riskAnalyzer.getRecentFailures(primaryService);
  const risk = calculateCommitRisk(gitInfo, failures);

  printRiskReport(gitInfo, risk);

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackNotifier = loadSlackNotifier();

      if (!slackNotifier) {
        console.log('Slack webhook configured, but @slack/webhook is not installed. Skipping Slack briefing.\n');
      } else {
        await slackNotifier.sendDeployBriefing(
          primaryService,
          gitInfo.branch,
          gitInfo.author,
          gitInfo.commitSha,
          risk
        );
        console.log('Briefing sent to Slack\n');
      }
    } catch (error) {
      console.log(`Slack notification failed: ${error.message}\n`);
    }
  }

  if (risk.level === 'HIGH') {
    console.log(`${'\x1b[31m'}HIGH RISK: Commit blocked. Review changes before committing.${'\x1b[0m'}\n`);
    process.exit(EXIT_CODES.BLOCK);
  }

  if (risk.level === 'MEDIUM') {
    console.log(`${'\x1b[33m'}MEDIUM RISK: Proceeding with caution.${'\x1b[0m'}\n`);
  } else {
    console.log(`${'\x1b[32m'}LOW RISK: Safe to commit.${'\x1b[0m'}\n`);
  }

  process.exit(EXIT_CODES.PROCEED);
}

if (require.main === module) {
  runPreCommitHook().catch((error) => {
    console.error('Pre-commit hook error:', error.message);
    process.exit(EXIT_CODES.BLOCK);
  });
}

module.exports = { runPreCommitHook, calculateCommitRisk, getGitInfo };
