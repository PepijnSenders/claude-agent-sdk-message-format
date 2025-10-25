import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../../src/index';

describe('Hook Callback Formatters', () => {
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

  it('should format PreToolUse hook', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'PreToolUse',
      hook_event: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'echo "hello world"' },
      stdout: 'Tool execution started',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🔧 Pre-Tool Use: Bash');
    expect(result).toContain('Working directory:');
    expect(result).toContain('Tool input:');
    expect(result).toContain('echo \\"hello world\\"');
  });

  it('should format PostToolUse hook with response', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'PostToolUse',
      hook_event: 'PostToolUse',
      tool_name: 'Read',
      tool_input: { file_path: '/path/to/file.txt' },
      tool_response: { content: 'File content here' },
      stdout: 'Tool completed successfully',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('✅ Post-Tool Use: Read');
    expect(result).toContain('Tool response:');
    expect(result).toContain('File content here');
  });

  it('should format PostToolUse hook with truncated long response', () => {
    const longResponse = 'x'.repeat(600);
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'PostToolUse',
      hook_event: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'ls -la' },
      tool_response: longResponse,
      stdout: 'Tool completed',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('✅ Post-Tool Use: Bash');
    expect(result).toContain('... (truncated)');
    expect(result.length).toBeLessThan(longResponse.length + 250);
  });

  it('should format Notification hook with title', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'Notification',
      hook_event: 'Notification',
      title: 'Build Completed',
      message: 'Your build has completed successfully',
      stdout: 'Notification sent',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🔔 Notification');
    expect(result).toContain('Build Completed');
    expect(result).toContain('Message:');
    expect(result).toContain('Your build has completed successfully');
  });

  it('should format Notification hook without title', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'Notification',
      hook_event: 'Notification',
      message: 'Simple notification message',
      stdout: 'Notification sent',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🔔 Notification');
    expect(result).toContain('Message:');
    expect(result).toContain('Simple notification message');
    expect(result).not.toContain('Build Completed');
  });

  it('should format UserPromptSubmit hook', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'UserPromptSubmit',
      hook_event: 'UserPromptSubmit',
      prompt: 'Please help me implement a new feature for user authentication',
      stdout: 'Prompt submitted',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('📝 User Prompt Submitted');
    expect(result).toContain('Prompt:');
    expect(result).toContain('Please help me implement a new feature');
  });

  it('should format UserPromptSubmit hook with truncated long prompt', () => {
    const longPrompt = 'x'.repeat(300);
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'UserPromptSubmit',
      hook_event: 'UserPromptSubmit',
      prompt: longPrompt,
      stdout: 'Prompt submitted',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('📝 User Prompt Submitted');
    expect(result).toContain('... (truncated)');
    expect(result.length).toBeLessThan(longPrompt.length + 250);
  });

  it('should format SessionStart hook with startup source', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'SessionStart',
      hook_event: 'SessionStart',
      source: 'startup',
      transcript_path: '/path/to/transcript.json',
      permission_mode: 'default',
      stdout: 'Session started',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🚀 Session Started (startup)');
    expect(result).toContain('Transcript:');
    expect(result).toContain('/path/to/transcript.json');
    expect(result).toContain('Permission mode: default');
  });

  it('should format SessionStart hook with resume source', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'SessionStart',
      hook_event: 'SessionStart',
      source: 'resume',
      stdout: 'Session resumed',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('▶️ Session Started (resume)');
  });

  it('should format SessionStart hook with compact source', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'SessionStart',
      hook_event: 'SessionStart',
      source: 'compact',
      stdout: 'Session compacted',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('📦 Session Started (compact)');
  });

  it('should format SessionEnd hook', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'SessionEnd',
      hook_event: 'SessionEnd',
      reason: 'user_logout',
      transcript_path: '/path/to/transcript.json',
      stdout: 'Session ended',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🛑 Session Ended');
    expect(result).toContain('Reason: user_logout');
    expect(result).toContain('Transcript:');
    expect(result).toContain('/path/to/transcript.json');
  });

  it('should format Stop hook with active stop', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'Stop',
      hook_event: 'Stop',
      stop_hook_active: true,
      stdout: 'Stop hook triggered',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('⏸️ Stop Hook Triggered');
    expect(result).toContain('Stop hook is active');
  });

  it('should format Stop hook with inactive stop', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'Stop',
      hook_event: 'Stop',
      stop_hook_active: false,
      stdout: 'Stop hook triggered',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🛑 Stop Hook Triggered');
    expect(result).toContain('Stop hook is inactive');
  });

  it('should format SubagentStop hook', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'SubagentStop',
      hook_event: 'SubagentStop',
      stop_hook_active: true,
      stdout: 'Subagent stop triggered',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('⏸️ Subagent Stop Hook Triggered');
    expect(result).toContain('Stop hook is active');
  });

  it('should format PreCompact hook with manual trigger', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'PreCompact',
      hook_event: 'PreCompact',
      trigger: 'manual',
      custom_instructions: 'Keep recent conversation context',
      stdout: 'Compaction started',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('👆 Pre-Compaction (manual)');
    expect(result).toContain('Custom instructions:');
    expect(result).toContain('Keep recent conversation context');
  });

  it('should format PreCompact hook with auto trigger', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'PreCompact',
      hook_event: 'PreCompact',
      trigger: 'auto',
      custom_instructions: null,
      stdout: 'Auto compaction started',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('🤖 Pre-Compaction (auto)');
    expect(result).toContain('No custom instructions');
  });

  it('should handle unknown hook types gracefully with fallback', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'UnknownHook',
      hook_event: 'UnknownHook',
      stdout: 'Unknown hook executed',
      exit_code: 0,
    };

    const result = formatMessage(message);

    expect(result).toContain('⚙ Hook: UnknownHook (UnknownHook)');
    expect(result).toContain('stdout:');
    expect(result).toContain('Unknown hook executed');
  });

  it('should fallback to original formatting when hook_event is missing', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system',
      subtype: 'hook_response',
      hook_name: 'SomeHook',
      stdout: 'Hook executed',
      stderr: 'Some warning',
      exit_code: 1,
    };

    const result = formatMessage(message);

    expect(result).toContain('⚙ Hook: SomeHook (unknown)');
    expect(result).toContain('stdout:');
    expect(result).toContain('stderr:');
    expect(result).toContain('✗ Exit code: 1');
  });
});
