#!/usr/bin/env node

import { formatMessage } from './index';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

/**
 * CLI interface for claude-pretty-printer
 * Supports multiple input methods: stdin, file, or inline JSON
 */

async function processStdin() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

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
    throw new Error(`Error processing stdin: ${(error as Error).message}`);
  }
}

function processFile(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
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
    throw new Error(`Error reading file: ${(error as Error).message}`);
  }
}

function processInlineJSON(jsonString: string) {
  try {
    const message = JSON.parse(jsonString);
    const formatted = formatMessage(message);
    if (formatted.trim()) {
      console.log(formatted);
    }
  } catch (error) {
    throw new Error(`Error parsing JSON: ${(error as Error).message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.length === 0) {
      // No arguments: read from stdin
      console.log('');
      await processStdin();
    } else if (args.length === 1) {
      const arg = args[0];

      if (arg.startsWith('{')) {
        // Inline JSON
        console.log('');
        processInlineJSON(arg);
      } else if (arg === '--help' || arg === '-h') {
        // Show help (handled below)
        return;
      } else {
        // File path
        console.log('');
        processFile(arg);
      }
    } else {
      throw new Error('Too many arguments. Use --help for usage information.');
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
claude-pretty-printer - Format Claude Agent SDK messages

USAGE:
  # Read from stdin (pipe from Claude CLI)
  claude -p --output-format json | npx claude-pretty-printer

  # Read from file (multi-line JSON)
  npx claude-pretty-printer messages.txt

  # Inline JSON (single message)
  npx claude-pretty-printer '{"type":"assistant","message":{"content":"Hello"}}'

  # Read from file with relative path
  npx claude-pretty-printer ./data/messages.json

OPTIONS:
  -h, --help    Show this help message

DESCRIPTION:
  Formats Claude Agent SDK JSON messages for beautiful CLI output.
  Supports three input methods:
    • stdin: Pipe JSON messages line by line
    • file: Read multi-line JSON from a file
    • inline: Format single JSON argument

INPUT FORMATS:
  • Stdin: Each line should be a complete JSON object
  • File: File can contain multiple JSON objects (one per line)
  • Inline: Single complete JSON object

EXAMPLES:
  # Pipe from Claude CLI
  claude -p --output-format json "test" | npx claude-pretty-printer

  # Format from file
  npx claude-pretty-printer messages.json

  # Format inline JSON
  npx claude-pretty-printer '{"type":"result","subtype":"success","result":"Done"}'

  # Mixed usage examples
  cat log.json | grep "type.*assistant" | npx claude-pretty-printer
  echo '{"type":"assistant","message":{"content":"Hello"}}' > msg.json && npx claude-pretty-printer msg.json
`);
  process.exit(0);
}

main();