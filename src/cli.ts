#!/usr/bin/env node

import { formatMessage } from './index';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import pc from 'picocolors';

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
  console.log('');
  const box = pc.bold(pc.cyan('┌─────────────────────────────────────────────────────────────┐'));
  const title = pc.bold(pc.cyan('│')) + pc.bold('                    ') + pc.bold(pc.magenta('claude-pretty-printer')) + pc.bold('                     ') + pc.bold(pc.cyan('│'));
  const line1 = pc.bold(pc.cyan('│')) + '  ' + pc.dim('Transform raw Claude Agent SDK messages into') + '        ' + pc.bold(pc.cyan('│'));
  const line2 = pc.bold(pc.cyan('│')) + '  ' + pc.dim('beautiful, readable CLI output') + '                     ' + pc.bold(pc.cyan('│'));
  const bottom = pc.bold(pc.cyan('└─────────────────────────────────────────────────────────────┘'));

  console.log(box);
  console.log(title);
  console.log(line1);
  console.log(line2);
  console.log(bottom);
  console.log('');

  console.log(pc.bold(pc.green('▶ USAGE EXAMPLES:')));
  console.log('');
  console.log(pc.cyan('  📺  Pipe from Claude CLI'));
  console.log(pc.dim('      claude -p --output-format json "test" | npx claude-pretty-printer'));
  console.log('');
  console.log(pc.cyan('  📁  Read from file'));
  console.log(pc.dim('      npx claude-pretty-printer messages.json'));
  console.log('');
  console.log(pc.cyan('  💬  Inline JSON'));
  console.log(pc.dim('      npx claude-pretty-printer \'{"type":"result","subtype":"success","result":"Done"}\''));
  console.log('');

  console.log(pc.bold(pc.yellow('▶ INPUT METHODS:')));
  console.log('');
  console.log(pc.dim('  • stdin  ') + pc.white('- Pipe JSON messages line by line'));
  console.log(pc.dim('  • file   ') + pc.white('- Read multi-line JSON from a file'));
  console.log(pc.dim('  • inline ') + pc.white('- Format single JSON argument'));
  console.log('');

  console.log(pc.bold(pc.magenta('▶ MESSAGE FORMATS:')));
  console.log('');
  console.log(pc.dim('  Each line should be a complete JSON object representing an SDK message.'));
  console.log(pc.dim('  Supported types: ') + pc.white('assistant, user, result, system, stream_event'));
  console.log('');

  console.log(pc.bold(pc.blue('▶ OPTIONS:')));
  console.log('');
  console.log(pc.dim('  -h, --help    ') + pc.white('Show this help message'));
  console.log('');

  console.log(pc.green('✨') + pc.dim(' Happy formatting!'));
  console.log('');

  process.exit(0);
}

main();