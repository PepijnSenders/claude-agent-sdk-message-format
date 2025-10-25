import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import pc from 'picocolors';
import { formatHookMessage } from './hooks';

export function formatSystemMessage(message: Extract<SDKMessage, { type: 'system' }>): string {
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
    // Check if this is one of our known hook types
    if (message.hook_event) {
      try {
        // Create hook data object that matches the expected format
        const hookData: any = {
          ...message, // Include all message properties
          transcript_path: (message as any).transcript_path || '', // Will be populated if available
          cwd: process.cwd(),
          permission_mode: (message as any).permission_mode || undefined,
        };

        return formatHookMessage(message.hook_event, hookData);
      } catch (_error) {
        // Fallback to original formatting if hook formatting fails
        // Silently ignore error for cleaner output
      }
    }

    // Fallback to original hook_response formatting
    const lines: string[] = [];
    lines.push(
      `\n${pc.cyan('⚙')} ${pc.bold('Hook:')} ${message.hook_name || 'Unknown'} ${pc.dim(`(${message.hook_event || 'unknown'})`)}`
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
