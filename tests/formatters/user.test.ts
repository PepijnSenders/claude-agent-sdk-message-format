import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../../src/index';

describe('User Message Formatting', () => {
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

  it('should format simple text messages', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: 'Can you help me with my code?',
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ USER');
    expect(result).toContain('Can you help me with my code?');
    expect(result).not.toContain('(Tool Results)');
  });

  it('should format messages with tool results with special header', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_1',
            content: 'File content here',
            is_error: false,
          },
        ],
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ USER (Tool Results)');
    expect(result).toContain('✓ Tool result: tool_1');
    expect(result).toContain('File content here');
  });

  it('should format tool results with errors', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tool_2',
            content: 'File not found',
            is_error: true,
          },
        ],
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ USER (Tool Results)');
    expect(result).toContain('✗ Tool result: tool_2');
    expect(result).toContain('File not found');
    expect(result).toContain('✗ Error in tool execution');
  });

  it('should format mixed content with text and tool results', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: [
          'Here is the result of my analysis:',
          {
            type: 'tool_result',
            tool_use_id: 'tool_3',
            content: 'Analysis completed successfully',
            is_error: false,
          },
        ],
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ USER (Tool Results)');
    expect(result).toContain('Here is the result of my analysis:');
    expect(result).toContain('✓ Tool result: tool_3');
  });

  it('should format synthetic user messages', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: 'This is a synthetic message',
      },
      parent_tool_use_id: null,
      isSynthetic: true,
    };

    const result = formatMessage(message);

    expect(result).toContain('[Synthetic]');
    expect(result).toContain('This is a synthetic message');
  });

  it('should skip replay messages', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: 'This should not appear',
      },
      parent_tool_use_id: null,
      isReplay: true,
    };

    const result = formatMessage(message);

    expect(result).toBe('');
  });

  it('should handle empty content gracefully', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user',
      message: {
        role: 'user',
        content: '',
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toBe('');
  });
});
