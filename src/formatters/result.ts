import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import pc from 'picocolors';

export function formatResultMessage(message: Extract<SDKMessage, { type: 'result' }>): string {
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
