import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import pc from 'picocolors';

/**
 * Get terminal width, defaulting to 80 if not available
 */
function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Creates a horizontal line of the specified character
 */
function createLine(char: string, width?: number): string {
  const termWidth = width ?? getTerminalWidth();
  return char.repeat(termWidth);
}

/**
 * Wraps content in a box with header
 */
function createBox(header: string, content: string): string {
  const termWidth = getTerminalWidth();
  const topLine = createLine('─', termWidth);
  const bottomLine = createLine('─', termWidth);

  return `${pc.dim(topLine)}\n${header}\n${content}\n${pc.dim(bottomLine)}`;
}

// Replicated types from @anthropic-ai/sdk for better type safety
type BetaTextBlock = {
  type: 'text';
  text: string;
};

type BetaToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};

type BetaContentBlock = BetaTextBlock | BetaToolUseBlock;

type BetaThinkingBlock = {
  type: 'text';
  text: string;
};

type BetaMessageContent = BetaContentBlock[];

type BetaMessageWithThinking = {
  content: BetaMessageContent;
  thinking?: BetaThinkingBlock[];
  [key: string]: any;
};

/**
 * Formats a tool parameter value in a compact, readable way
 */
function formatToolParamValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    // Truncate very long strings
    if (value.length > 100) {
      return `"${value.slice(0, 97)}..."`;
    }
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3) {
      return `[${value.map((v) => formatToolParamValue(v)).join(', ')}]`;
    }
    return `[${value
      .slice(0, 3)
      .map((v) => formatToolParamValue(v))
      .join(', ')}, ... +${value.length - 3} more]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    if (entries.length === 1) {
      const [k, v] = entries[0];
      return `{ ${k}: ${formatToolParamValue(v)} }`;
    }
    // For complex objects, show in compact JSON
    const json = JSON.stringify(value);
    if (json.length <= 80) return json;
    return `{ ${entries.length} properties }`;
  }
  return String(value);
}

/**
 * Validates required fields for different message types
 * @param message The SDK message to validate
 * @throws Error with helpful message if required fields are missing
 */
function validateMessage(message: SDKMessage): void {
  switch (message.type) {
    case 'result':
      validateResultMessage(message);
      break;
    case 'assistant':
      validateAssistantMessage(message);
      break;
    case 'user':
      validateUserMessage(message);
      break;
  }
}

/**
 * Validates required fields for result messages
 */
function validateResultMessage(message: Extract<SDKMessage, { type: 'result' }>): void {
  const requiredFields = [
    'duration_ms',
    'total_cost_usd',
    'usage',
    'num_turns',
    'session_id',
    'uuid',
  ];
  const missingFields = requiredFields.filter((field) => !(field in message));

  if (missingFields.length > 0) {
    throw new Error(
      `Result messages require these fields: ${missingFields.join(', ')}.\n` +
        `Example: npx claude-pretty-printer '${JSON.stringify({
          type: 'result',
          subtype: 'success',
          duration_ms: 500,
          duration_api_ms: 400,
          num_turns: 1,
          result: 'Task completed successfully',
          session_id: 'test-123',
          total_cost_usd: 0.005,
          usage: { input_tokens: 100, output_tokens: 50 },
          modelUsage: {},
          permission_denials: [],
          uuid: '550e8400-e29b-41d4-a716-446655440000',
        })}'`
    );
  }
}

/**
 * Validates required fields for assistant messages
 */
function validateAssistantMessage(message: Extract<SDKMessage, { type: 'assistant' }>): void {
  if (!message.message) {
    throw new Error('Assistant messages require a "message" field with content');
  }
}

/**
 * Validates required fields for user messages
 */
function validateUserMessage(message: Extract<SDKMessage, { type: 'user' }>): void {
  if (!message.message) {
    throw new Error('User messages require a "message" field with content');
  }
}

/**
 * Formats an SDKMessage for CLI output with colors and boxes
 * @param message The SDK message to format
 * @param showBox Whether to wrap the message in a box (default: true)
 * @returns Formatted string ready for CLI display
 */
export function formatMessage(message: SDKMessage, showBox = true): string {
  // Validate the message has required fields
  validateMessage(message);

  let content: string;
  let header: string;

  switch (message.type) {
    case 'assistant': {
      header = pc.blue('◆ ASSISTANT');
      content = formatAssistantMessage(message);
      break;
    }
    case 'user': {
      const userResult = formatUserMessage(message);
      header = userResult.header;
      content = userResult.content;
      break;
    }
    case 'result': {
      header = pc.magenta('◆ RESULT');
      content = formatResultMessage(message);
      break;
    }
    case 'system': {
      header = pc.yellow('◆ SYSTEM');
      content = formatSystemMessage(message);
      break;
    }
    case 'stream_event': {
      // Stream events don't get boxes
      return formatStreamEvent(message);
    }
    default: {
      header = pc.red('◆ UNKNOWN');
      content = `[Unknown message type: ${(message as any).type}]`;
      break;
    }
  }

  // Skip box for empty content or stream events
  if (!showBox || !content || content.trim().length === 0) {
    return content;
  }

  return createBox(header, content);
}

function formatAssistantMessage(message: Extract<SDKMessage, { type: 'assistant' }>): string {
  const lines: string[] = [];
  const msg = message.message as BetaMessageWithThinking;

  // Parse content blocks
  for (const block of msg.content) {
    if (block.type === 'text') {
      const textBlock = block as BetaTextBlock;
      lines.push(textBlock.text);
    } else if (block.type === 'tool_use') {
      const toolUseBlock = block as BetaToolUseBlock;
      lines.push(`\n${pc.cyan('→')} ${pc.bold(toolUseBlock.name)}`);

      // Format input parameters in a compact, readable way
      if (toolUseBlock.input && typeof toolUseBlock.input === 'object') {
        const entries = Object.entries(toolUseBlock.input);
        if (entries.length > 0) {
          for (const [key, value] of entries) {
            const formattedValue = formatToolParamValue(value);
            lines.push(`  ${pc.dim(key)}: ${formattedValue}`);
          }
        }
      }
    }
  }

  // Add thinking content if present
  if (msg.thinking && Array.isArray(msg.thinking)) {
    const thinking = msg.thinking
      .filter((t: BetaThinkingBlock) => t.type === 'text')
      .map((t: BetaThinkingBlock) => t.text)
      .join('\n');
    if (thinking) {
      lines.push(`\n${pc.dim(pc.italic('[Thinking]'))}\n${pc.dim(thinking)}`);
    }
  }

  return lines.join('\n');
}

function formatUserMessage(message: Extract<SDKMessage, { type: 'user' }>): {
  header: string;
  content: string;
} {
  if ('isReplay' in message && message.isReplay) {
    return { header: '', content: '' }; // Skip replay messages to avoid duplication
  }

  const content = message.message.content;
  const lines: string[] = [];
  let hasToolResults = false;

  if (typeof content === 'string') {
    lines.push(content);
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'string') {
        lines.push(block);
      } else if (block.type === 'text') {
        lines.push(block.text);
      } else if (block.type === 'image') {
        lines.push(pc.dim('[Image]'));
      } else if (block.type === 'tool_result') {
        hasToolResults = true;
        const resultIcon = block.is_error ? pc.red('✗') : pc.green('✓');
        lines.push(`\n${resultIcon} ${pc.dim(`Tool result: ${block.tool_use_id}`)}`);
        if (typeof block.content === 'string') {
          lines.push(block.content);
        } else if (Array.isArray(block.content)) {
          for (const contentBlock of block.content) {
            if (contentBlock.type === 'text') {
              lines.push(contentBlock.text);
            } else if (contentBlock.type === 'image') {
              lines.push(pc.dim('[Image result]'));
            }
          }
        }
        if (block.is_error) {
          lines.push(pc.red('✗ Error in tool execution'));
        }
      }
    }
  }

  const contentText = message.isSynthetic
    ? `${pc.dim('[Synthetic]')} ${lines.join('\n')}`
    : lines.join('\n');

  // Choose header based on whether there are tool results
  const header = hasToolResults ? pc.green('◆ USER (Tool Results)') : pc.green('◆ USER');

  return { header, content: contentText };
}

function formatResultMessage(message: Extract<SDKMessage, { type: 'result' }>): string {
  const lines: string[] = [];

  if (message.subtype === 'success') {
    lines.push(pc.green('✓ Task completed successfully'));
    lines.push(`\n${pc.bold('Result:')} ${message.result}`);
  } else if (message.subtype === 'error_max_turns') {
    lines.push(pc.red('✗ Error: Maximum turns reached'));
  } else if (message.subtype === 'error_during_execution') {
    lines.push(pc.red('✗ Error during execution'));
  }

  lines.push(`\n${pc.bold('Statistics:')}`);
  lines.push(`  ${pc.dim('Duration:')} ${(message.duration_ms / 1000).toFixed(2)}s`);
  lines.push(`  ${pc.dim('API Time:')} ${(message.duration_api_ms / 1000).toFixed(2)}s`);
  lines.push(`  ${pc.dim('Turns:')} ${message.num_turns}`);
  lines.push(`  ${pc.dim('Cost:')} ${pc.yellow(`$${message.total_cost_usd.toFixed(4)}`)}`);

  // Token usage
  lines.push(`\n${pc.bold('Token Usage:')}`);
  lines.push(`  ${pc.dim('Input:')} ${message.usage.input_tokens.toLocaleString()}`);
  lines.push(`  ${pc.dim('Output:')} ${message.usage.output_tokens.toLocaleString()}`);
  if (message.usage.cache_read_input_tokens) {
    lines.push(
      `  ${pc.dim('Cache Read:')} ${pc.cyan(message.usage.cache_read_input_tokens.toLocaleString())}`
    );
  }
  if (message.usage.cache_creation_input_tokens) {
    lines.push(
      `  ${pc.dim('Cache Creation:')} ${message.usage.cache_creation_input_tokens.toLocaleString()}`
    );
  }

  // Model-specific usage
  if (Object.keys(message.modelUsage).length > 0) {
    lines.push(`\n${pc.bold('Per-Model Usage:')}`);
    for (const [model, usage] of Object.entries(message.modelUsage)) {
      lines.push(`  ${pc.cyan(model)}:`);
      lines.push(`    ${pc.dim('Input:')} ${usage.inputTokens.toLocaleString()}`);
      lines.push(`    ${pc.dim('Output:')} ${usage.outputTokens.toLocaleString()}`);
      if (usage.cacheReadInputTokens) {
        lines.push(
          `    ${pc.dim('Cache Read:')} ${pc.cyan(usage.cacheReadInputTokens.toLocaleString())}`
        );
      }
      if (usage.cacheCreationInputTokens) {
        lines.push(
          `    ${pc.dim('Cache Creation:')} ${usage.cacheCreationInputTokens.toLocaleString()}`
        );
      }
      lines.push(`    ${pc.dim('Cost:')} ${pc.yellow(`$${usage.costUSD.toFixed(4)}`)}`);
    }
  }

  // Permission denials
  if (message.permission_denials.length > 0) {
    lines.push(`\n${pc.bold(pc.red('Permission Denials:'))} ${message.permission_denials.length}`);
    for (const denial of message.permission_denials) {
      lines.push(`  ${pc.red('•')} ${denial.tool_name} ${pc.dim(`(${denial.tool_use_id})`)}`);
    }
  }

  return lines.join('\n');
}

function formatSystemMessage(message: Extract<SDKMessage, { type: 'system' }>): string {
  if (message.subtype === 'init') {
    const lines: string[] = [];
    lines.push(`\n${pc.bold('Claude Code Session Initialized')}`);
    lines.push(`\n${pc.dim('Version:')} ${message.claude_code_version}`);
    lines.push(`${pc.dim('Model:')} ${pc.cyan(message.model)}`);
    lines.push(`${pc.dim('Working Directory:')} ${message.cwd}`);
    lines.push(`${pc.dim('Permission Mode:')} ${message.permissionMode}`);
    lines.push(`${pc.dim('API Key Source:')} ${message.apiKeySource}`);

    if (message.tools.length > 0) {
      lines.push(`\n${pc.dim('Available Tools:')} ${message.tools.length}`);
    }

    if (message.mcp_servers.length > 0) {
      lines.push(`\n${pc.bold('MCP Servers:')}`);
      for (const server of message.mcp_servers) {
        const statusEmoji =
          server.status === 'connected'
            ? pc.green('✓')
            : server.status === 'failed'
              ? pc.red('✗')
              : server.status === 'needs-auth'
                ? pc.yellow('⚠')
                : pc.dim('○');
        lines.push(`  ${statusEmoji} ${server.name} ${pc.dim(`(${server.status})`)}`);
      }
    }

    if (message.slash_commands.length > 0) {
      lines.push(`\n${pc.dim('Slash Commands:')} ${message.slash_commands.join(', ')}`);
    }

    if (message.agents && message.agents.length > 0) {
      lines.push(`\n${pc.dim('Agents:')} ${message.agents.join(', ')}`);
    }

    if (message.skills && message.skills.length > 0) {
      lines.push(`\n${pc.dim('Skills:')} ${message.skills.join(', ')}`);
    }

    return lines.join('\n');
  } else if (message.subtype === 'compact_boundary') {
    const lines: string[] = [];
    lines.push(
      `\n${pc.yellow('⚡')} ${pc.bold('Conversation Compacted')} ${pc.dim(`(${message.compact_metadata.trigger})`)}`
    );
    lines.push(
      `   ${pc.dim('Previous tokens:')} ${message.compact_metadata.pre_tokens.toLocaleString()}`
    );
    return lines.join('\n');
  } else if (message.subtype === 'hook_response') {
    const lines: string[] = [];
    lines.push(
      `\n${pc.cyan('⚙')} ${pc.bold('Hook:')} ${message.hook_name} ${pc.dim(`(${message.hook_event})`)}`
    );

    if (message.stdout) {
      lines.push(`\n${pc.dim('stdout:')}`);
      lines.push(
        message.stdout
          .split('\n')
          .map((l) => `  ${l}`)
          .join('\n')
      );
    }

    if (message.stderr) {
      lines.push(`\n${pc.dim('stderr:')}`);
      lines.push(
        pc.red(
          message.stderr
            .split('\n')
            .map((l) => `  ${l}`)
            .join('\n')
        )
      );
    }

    if (message.exit_code !== undefined) {
      const exitIcon = message.exit_code === 0 ? pc.green('✓') : pc.red('✗');
      lines.push(`\n${exitIcon} ${pc.dim('Exit code:')} ${message.exit_code}`);
    }

    return lines.join('\n');
  }

  return pc.dim('[Unknown system message subtype]');
}

function formatStreamEvent(message: Extract<SDKMessage, { type: 'stream_event' }>): string {
  const event = message.event;

  switch (event.type) {
    case 'message_start':
      return ''; // Usually handled at the beginning

    case 'content_block_start':
      if (event.content_block.type === 'tool_use') {
        return `\n${pc.dim(`[Starting tool: ${event.content_block.name}]`)}`;
      }
      return '';

    case 'content_block_delta':
      if (event.delta.type === 'text_delta') {
        return event.delta.text;
      }
      if (event.delta.type === 'input_json_delta') {
        return event.delta.partial_json;
      }
      return '';

    case 'content_block_stop':
      return ''; // Usually handled at block completion

    case 'message_delta':
      return ''; // Usage updates, typically silent

    case 'message_stop':
      return ''; // End of message, typically handled elsewhere

    default:
      return '';
  }
}
// Test change
