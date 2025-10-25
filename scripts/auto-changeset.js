#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Get changed files since last release
function getChangedFiles() {
  try {
    // Get the last tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const changedFiles = execSync(`git diff --name-only ${lastTag} HEAD`, { encoding: 'utf8' })
      .split('\n')
      .filter((file) => file.trim());
    return changedFiles;
  } catch {
    // If no tags, get all files
    return execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .filter((file) => file.trim());
  }
}

// Analyze changes to determine version type
function analyzeChanges(changedFiles) {
  const sourceFiles = changedFiles.filter(
    (file) => file.startsWith('src/') && (file.endsWith('.ts') || file.endsWith('.js'))
  );

  const testFiles = changedFiles.filter(
    (file) => file.startsWith('tests/') || file.includes('.test.')
  );

  const _configFiles = changedFiles.filter((file) =>
    ['package.json', 'tsconfig.json', 'biome.json', '.changeset/'].some((pattern) =>
      file.includes(pattern)
    )
  );

  const docsFiles = changedFiles.filter(
    (file) => file.startsWith('docs/') || file === 'README.md' || file === 'CHANGELOG.md'
  );

  // Determine change type based on what changed
  if (changedFiles.some((file) => file.includes('BREAKING') || file.includes('breaking'))) {
    return 'major';
  }

  // If we changed API significantly (exports, public interfaces)
  if (sourceFiles.some((file) => file.includes('index.ts') || file.includes('cli.ts'))) {
    const indexContent = readFileSync('src/index.ts', 'utf8');
    if (indexContent.includes('export function') || indexContent.includes('export type')) {
      return 'minor';
    }
  }

  // If new features were added (not just fixes)
  const hasNewFeatures =
    sourceFiles.length > 0 &&
    !docsFiles.some((file) => file.includes('fix') || file.includes('bug'));

  if (hasNewFeatures && sourceFiles.length > testFiles.length) {
    return 'minor';
  }

  // Default to patch for fixes, test changes, or documentation
  return 'patch';
}

// Generate description based on changes
function generateDescription(changedFiles) {
  const sourceFiles = changedFiles.filter(
    (file) => file.startsWith('src/') && (file.endsWith('.ts') || file.endsWith('.js'))
  );

  if (sourceFiles.length === 0) {
    return 'Documentation and configuration updates';
  }

  // Look for common patterns in commits
  try {
    const recentCommits = execSync('git log --oneline --since="1 week ago"', { encoding: 'utf8' });
    if (recentCommits.includes('feat') || recentCommits.includes('add')) {
      return 'Add new features and improvements';
    }
    if (recentCommits.includes('fix') || recentCommits.includes('bug')) {
      return 'Fix bugs and improve stability';
    }
  } catch {
    // Fallback if git command fails
  }

  return 'Update and improve functionality';
}

// Create changeset file
function createChangeset(versionType, description) {
  const id = randomBytes(3).toString('hex');
  const fileName = `${id}-auto.md`;
  const filePath = path.join('.changeset', fileName);

  const content = `---
'claude-pretty-printer': ${versionType}
---

${description}
`;

  writeFileSync(filePath, content);
  console.log(`✅ Created changeset: ${fileName}`);
  return fileName;
}

// Check if changesets already exist
function hasExistingChangesets() {
  const changesetDir = '.changeset';
  if (!existsSync(changesetDir)) return false;

  const files = readdirSync(changesetDir);
  return files.some((file) => file.endsWith('.md') && !file.includes('README'));
}

// Main function
function main() {
  console.log('🔍 Analyzing changes for automatic changeset creation...');

  if (hasExistingChangesets()) {
    console.log('ℹ️  Changesets already exist, skipping auto-creation');
    return;
  }

  const changedFiles = getChangedFiles();
  console.log(`📁 Found ${changedFiles.length} changed files`);

  if (changedFiles.length === 0) {
    console.log('ℹ️  No changes detected');
    return;
  }

  const versionType = analyzeChanges(changedFiles);
  const description = generateDescription(changedFiles);

  console.log(`📦 Detected change type: ${versionType}`);
  console.log(`📝 Description: ${description}`);

  createChangeset(versionType, description);
}

main();
