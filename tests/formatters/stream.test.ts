import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../../src/index';

describe('Stream Event Formatting', () => {
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

  it('should format text delta events', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'stream_event',
      event: {
        type: 'content_block_delta',
        delta: {
          type: 'text_delta',
          text: 'Hello',
        },
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toBe('Hello');
    expect(result).not.toContain('◆');
    expect(result).not.toContain('─');
  });

  it('should format tool use start events', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'stream_event',
      event: {
        type: 'content_block_start',
        content_block: {
          type: 'tool_use',
          id: 'tool_1',
          name: 'Read',
        },
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('[Starting tool: Read]');
  });

  it('should return empty string for events that should be silent', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'stream_event',
      event: {
        type: 'message_start',
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toBe('');
  });
});
