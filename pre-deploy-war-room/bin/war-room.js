#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HOOK_START = '# >>> pre-deploy-war-room >>>';
const HOOK_END = '# <<< pre-deploy-war-room <<<';

function getTargetRoot() {
  return process.env.INIT_CWD || process.cwd();
}

function getHooksDir(targetRoot) {
  try {
    const hooksPath = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], {
      cwd: targetRoot,
      encoding: 'utf-8'
    }).trim();

    return path.resolve(targetRoot, hooksPath);
  } catch (error) {
    const fallbackHooksDir = path.join(targetRoot, '.git', 'hooks');
    if (fs.existsSync(path.join(targetRoot, '.git'))) {
      return fallbackHooksDir;
    }

    return null;
  }
}

function buildHookBlock(hookDir) {
  const packageRoot = path.resolve(__dirname, '..');
  const cliPath = path.join(packageRoot, 'cli.js');
  const relativeCliPath = path.relative(hookDir, cliPath).replace(/\\/g, '/');

  return `${HOOK_START}
# Installed by pre-deploy-war-room
echo "Running Pre-Commit War Room..."
node "$(dirname "$0")/${relativeCliPath}"
status=$?
if [ $status -ne 0 ]; then
  exit $status
fi
${HOOK_END}
`;
}

function installHook() {
  const targetRoot = getTargetRoot();
  const hooksDir = getHooksDir(targetRoot);

  if (!hooksDir) {
    console.log('Skipping hook install: no git repository detected.');
    process.exit(0);
  }

  const hookPath = path.join(hooksDir, 'pre-commit');
  const hookBlock = buildHookBlock(hooksDir);

  try {
    fs.mkdirSync(hooksDir, { recursive: true });

    let existing = '';
    if (fs.existsSync(hookPath)) {
      existing = fs.readFileSync(hookPath, 'utf-8');
    }

    if (existing.includes(HOOK_START) && existing.includes(HOOK_END)) {
      console.log(`Pre-Deploy War Room hook already installed at ${hookPath}`);
      process.exit(0);
    }

    let nextContent = existing;
    if (!nextContent) {
      nextContent = '#!/bin/sh\n';
    } else if (!nextContent.endsWith('\n')) {
      nextContent += '\n';
    }

    nextContent += `\n${hookBlock}`;

    fs.writeFileSync(hookPath, nextContent, { mode: 0o755 });
    console.log(`Pre-Deploy War Room hook installed at ${hookPath}`);
  } catch (error) {
    console.error('Failed to install hook:', error.message);
    process.exit(1);
  }
}

function uninstallHook() {
  const targetRoot = getTargetRoot();
  const hooksDir = getHooksDir(targetRoot);

  if (!hooksDir) {
    console.log('Skipping uninstall: no git repository detected.');
    process.exit(0);
  }

  const hookPath = path.join(hooksDir, 'pre-commit');

  if (!fs.existsSync(hookPath)) {
    console.log('Hook not installed.');
    process.exit(0);
  }

  const existing = fs.readFileSync(hookPath, 'utf-8');
  const startIndex = existing.indexOf(HOOK_START);
  const endIndex = existing.indexOf(HOOK_END);

  if (startIndex === -1 || endIndex === -1) {
    console.log('Pre-Deploy War Room block not found in pre-commit hook.');
    process.exit(0);
  }

  const afterBlockIndex = endIndex + HOOK_END.length;
  let nextContent = `${existing.slice(0, startIndex)}${existing.slice(afterBlockIndex)}`;
  nextContent = nextContent.replace(/\n{3,}/g, '\n\n').trim();

  if (!nextContent) {
    fs.unlinkSync(hookPath);
    console.log('Pre-Deploy War Room hook removed.');
    process.exit(0);
  }

  if (!nextContent.startsWith('#!')) {
    nextContent = `#!/bin/sh\n${nextContent}`;
  }

  fs.writeFileSync(hookPath, `${nextContent}\n`, { mode: 0o755 });
  console.log('Pre-Deploy War Room hook removed.');
}

const command = process.argv[2];

if (command === 'install') {
  installHook();
} else if (command === 'uninstall') {
  uninstallHook();
} else {
  console.log(`
Pre-Deploy War Room CLI

Usage:
  war-room install     Install the pre-commit hook
  war-room uninstall   Remove the pre-commit hook
  war-room --help      Show this help

The package can auto-install its hook during npm install via postinstall.
  `);
}
