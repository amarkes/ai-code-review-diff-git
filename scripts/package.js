#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version || '1.0.0';

const [major, minor, patch] = currentVersion.split('.').map(Number);

const nextPatch = `${major}.${minor}.${(patch || 0) + 1}`;
const nextMinor = `${major}.${(minor || 0) + 1}.0`;
const nextMajor = `${(major || 0) + 1}.0.0`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`\n=== AI Code Review — Packaging ===`);
console.log(`Current version: v${currentVersion}\n`);
console.log(`Select SemVer version bump:`);
console.log(`  1) patch  → v${nextPatch} (default)`);
console.log(`  2) minor  → v${nextMinor}`);
console.log(`  3) major  → v${nextMajor}`);
console.log(`  4) keep   → v${currentVersion}\n`);

rl.question('Choose [1-4] (default 1): ', (answer) => {
  rl.close();

  const choice = answer.trim() || '1';
  let bumpType = 'patch';

  if (choice === '1' || choice.toLowerCase() === 'patch' || choice.toLowerCase() === 'p') {
    bumpType = 'patch';
  } else if (choice === '2' || choice.toLowerCase() === 'minor' || choice.toLowerCase() === 'm') {
    bumpType = 'minor';
  } else if (choice === '3' || choice.toLowerCase() === 'major' || choice.toLowerCase() === 'M') {
    bumpType = 'major';
  } else if (choice === '4' || choice.toLowerCase() === 'keep' || choice.toLowerCase() === 'none') {
    bumpType = null;
  } else {
    console.error(`Invalid choice: "${answer}". Defaulting to patch.`);
    bumpType = 'patch';
  }

  const args = ['package'];
  if (bumpType) {
    args.push(bumpType, '--no-git-tag-version');
  }
  args.push('--skip-license');

  console.log(`\nExecuting: vsce ${args.join(' ')}\n`);

  const result = spawnSync('vsce', args, {
    stdio: 'inherit',
    shell: true,
  });

  if (result.error || result.status !== 0) {
    process.exit(result.status || 1);
  }
});
