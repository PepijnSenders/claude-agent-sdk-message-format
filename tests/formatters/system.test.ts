import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../../src/index';

describe('System Message Formatting', () => {
  const originalColumns = process.stdout.columns;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      writable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      writable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
    });
  });

  it('should format init messages', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'init',
      claude_code_version: '1.0.0',
      model: 'claude-3-sonnet',
      cwd: '/path/to/project',
      permissionMode: 'default',
      apiKeySource: 'temporary',
      tools: ['Read', 'Write', 'Bash'],
      mcp_servers: [
        {
          name: 'filesystem',
          status: 'connected',
        },
        {
          name: 'database',
          status: 'failed',
        },
      ],
      slash_commands: ['help', 'clear'],
      agents: ['code-analyzer'],
      skills: ['javascript', 'typescript'],
      output_style: 'verbose',
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ SYSTEM');
    expect(result).toContain('Claude Code Session Initialized');
    expect(result).toContain('Version: 1.0.0');
    expect(result).toContain('Model: claude-3-sonnet');
    expect(result).toContain('Working Directory: /path/to/project');
    expect(result).toContain('Permission Mode: default');
    expect(result).toContain('Available Tools: 3');
    expect(result).toContain('✓ filesystem (connected)');
    expect(result).toContain('✗ database (failed)');
    expect(result).toContain('Slash Commands: help, clear');
    expect(result).toContain('Agents: code-analyzer');
    expect(result).toContain('Skills: javascript, typescript');
  });

  it('should format compact boundary messages', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'compact_boundary',
      compact_metadata: {
        trigger: 'manual',
        pre_tokens: 150000,
      },
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ SYSTEM');
    expect(result).toContain('⚡ Conversation Compacted (manual)');
    expect(result).toContain('Previous tokens: 150,000');
  });

  it('should format basic hook responses', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'pre-execution',
      hook_event: 'before_tool_use',
      stdout: 'Hook executed successfully',
      stderr: 'Warning: deprecated API used',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ SYSTEM');
    expect(result).toContain('⚙ Hook: pre-execution (before_tool_use)');
    expect(result).toContain('stdout:');
    expect(result).toContain('Hook executed successfully');
    expect(result).toContain('stderr:');
    expect(result).toContain('Warning: deprecated API used');
    expect(result).toContain('✓ Exit code: 0');
  });
});
