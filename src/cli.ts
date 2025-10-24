#!/usr/bin/env node

import { formatMessage } from './index';
import { createInterface } from 'readline';

/**
 * CLI interface for claude-pretty-printer
 * Reads JSON lines from stdin and formats them for display
 */

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  console.log('');

  try {
    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        const formatted = formatMessage(message);
        if (formatted.trim()) {
          console.log(formatted);
        }
      } catch (error) {
        console.error(`Error parsing JSON: ${(error as Error).message}`);
        console.error(`Invalid line: ${line}`);
      }
    }
  } catch (error) {
    console.error(`Error processing input: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
claude-pretty-printer - Format Claude Agent SDK messages

USAGE:
  claude-command --output-format json | npx claude-pretty-printer
  echo '{"type":"assistant","message":{"content":"Hello"}}' | npx claude-pretty-printer
  cat messages.json | npx claude-pretty-printer

OPTIONS:
  -h, --help    Show this help message

DESCRIPTION:
  Reads JSON messages from stdin and formats them for beautiful CLI output.
  Each line should be a complete JSON object representing an SDK message.

EXAMPLES:
  # Format messages from Claude CLI
  claude -p --output-format json --dangerously-skip-permissions "test" | npx claude-pretty-printer

  # Format from a file
  cat messages.json | npx claude-pretty-printer

  # Format single message
  echo '{"type":"assistant","message":{"content":"Hello"}}' | npx claude-pretty-printer
`);
  process.exit(0);
}

main();