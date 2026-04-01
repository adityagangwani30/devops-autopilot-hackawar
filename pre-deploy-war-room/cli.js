#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const riskAnalyzer = require('./riskAnalyzer');
const slackNotifier = require('./slackNotifier');

const HOOK_CONFIG_FILE = '.git/hooks/pre-commit-war-room';
const EXIT_CODES = { PROCEED: 0, BLOCK: 1, SKIP: 0 };

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const author = execSync('git log -1 --format="%an"', { encoding: 'utf-8' }).trim().replace(/"/g, '');
    
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n').filter(Boolean);
    
    const diffStats = execSync('git diff --cached --numstat', { encoding: 'utf-8' })
      .split('\n').filter(Boolean);

    let linesAdded = 0;
    let linesDeleted = 0;
    diffStats.forEach(line => {
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
    'auth': 'auth-service',
    'api': 'api-gateway',
    'payment': 'payment-service',
    'user': 'user-service',
    'notification': 'notification-service'
  };

  const services = new Set();
  files.forEach(file => {
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

  const criticalFiles = gitInfo.stagedFiles.filter(f => 
    f.includes('config') || f.includes('database') || f.includes('auth')
  );
  if (criticalFiles.length > 0) {
    score += 15;
    reasons.push(`Critical files modified: ${criticalFiles.join(', ')}`);
  }

  const level = score <= 35 ? 'LOW' : score <= 65 ? 'MEDIUM' : 'HIGH';
  const recommendation = score > 65 ? 'Consider reviewing changes carefully' :
                        score > 35 ? 'Review before merge' : 'Safe to commit';

  return { score: Math.min(score, 100), level, reasons, recommendation };
}

function printRiskReport(gitInfo, risk) {
  const emoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴' };
  const ansi = { LOW: '\x1b[32m', MEDIUM: '\x1b[33m', HIGH: '\x1b[31m', RESET: '\x1b[0m' };

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          ⚡ PRE-COMMIT WAR ROOM - RISK ANALYSIS         ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ ${ansi[risk.level]}${emoji[risk.level]} Risk Level: ${risk.level.padEnd(28)} ${ansi.RESET}║`);
  console.log(`║   Score: ${risk.score}/100                                  ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Branch: ${gitInfo.branch.padEnd(44)} ║`);
  console.log(`║ Commit: ${gitInfo.commitSha.padEnd(44)} ║`);
  console.log(`║ Author: ${gitInfo.author.padEnd(44)} ║`);
  console.log(`║ Files: ${String(gitInfo.stagedFiles.length).padEnd(45)} ║`);
  console.log(`║ Changes: +${String(gitInfo.linesAdded)} -${String(gitInfo.linesDeleted).padEnd(38)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║ Risk Factors:                                          ║');
  risk.reasons.forEach((reason, i) => {
    const truncated = reason.length > 48 ? reason.substring(0, 45) + '...' : reason;
    console.log(`║   • ${truncated.padEnd(46)} ║`);
  });
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Recommendation: ${risk.recommendation.padEnd(36)} ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

async function runPreCommitHook() {
  console.log('🔍 Running Pre-Commit War Room...\n');

  const gitInfo = getGitInfo();
  console.log(`Analyzing commit on branch: ${gitInfo.branch}`);
  console.log(`Files to commit: ${gitInfo.stagedFiles.length}`);
  console.log(`Changed services: ${gitInfo.changedServices.join(', ')}`);

  const failures = await riskAnalyzer.getRecentFailures(gitInfo.changedServices[0] || 'unknown');
  const risk = calculateCommitRisk(gitInfo, failures);

  printRiskReport(gitInfo, risk);

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await slackNotifier.sendDeployBriefing(
        gitInfo.branch,
        gitInfo.branch,
        gitInfo.author,
        gitInfo.commitSha,
        risk
      );
      console.log('📢 Briefing sent to Slack\n');
    } catch (error) {
      console.log(`⚠️  Slack notification failed: ${error.message}\n`);
    }
  }

  if (risk.level === 'HIGH') {
    console.log(`${'\x1b[31m'}⚠️  HIGH RISK: Commit blocked. Review changes before committing.${'\x1b[0m'}\n`);
    process.exit(EXIT_CODES.BLOCK);
  }

  if (risk.level === 'MEDIUM') {
    console.log(`${'\x1b[33m'}⚠️  MEDIUM RISK: Proceeding with caution.${'\x1b[0m'}\n`);
  } else {
    console.log(`${'\x1b[32m'}✅ LOW RISK: Safe to commit.${'\x1b[0m'}\n`);
  }

  process.exit(EXIT_CODES.PROCEED);
}

if (require.main === module) {
  runPreCommitHook().catch(error => {
    console.error('Pre-commit hook error:', error.message);
    process.exit(EXIT_CODES.BLOCK);
  });
}

module.exports = { runPreCommitHook, calculateCommitRisk, getGitInfo };
