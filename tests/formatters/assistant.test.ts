import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../../src/index';

describe('Assistant Message Formatting', () => {
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

  it('should format text content', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant',
      message: {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'text',
            text: 'Hello! How can I help you today?',
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ ASSISTANT');
    expect(result).toContain('Hello! How can I help you today?');
    expect(result).toContain('─');
  });

  it('should format tool use blocks', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant',
      message: {
        id: 'msg_2',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'text',
            text: 'Let me read that file for you.',
          },
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'Read',
            input: {
              file_path: '/path/to/file.txt',
            },
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 150,
          output_tokens: 75,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ ASSISTANT');
    expect(result).toContain('Let me read that file for you.');
    expect(result).toContain('→ Read');
    expect(result).toContain('file_path: "/path/to/file.txt"');
  });

  it('should format thinking content', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant',
      message: {
        id: 'msg_3',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'text',
            text: 'I need to analyze this carefully.',
          },
        ],
        thinking: [
          {
            type: 'text',
            text: 'Let me think about the best approach here...',
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 200,
          output_tokens: 100,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ ASSISTANT');
    expect(result).toContain('I need to analyze this carefully.');
    expect(result).toContain('[Thinking]');
    expect(result).toContain('Let me think about the best approach here...');
  });

  it('should format complex tool parameters', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant',
      message: {
        id: 'msg_4',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'tool_use',
            id: 'tool_2',
            name: 'Write',
            input: {
              file_path: '/path/to/file.ts',
              content: 'console.log("Hello, World!");',
              options: {
                overwrite: true,
                create_dirs: true,
              },
            },
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 180,
          output_tokens: 90,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('→ Write');
    expect(result).toContain('file_path: "/path/to/file.ts"');
    expect(result).toContain('options:');
  });

  it('should truncate very long strings in tool parameters', () => {
    const longString = 'x'.repeat(150);
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant',
      message: {
        id: 'msg_5',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'tool_use',
            id: 'tool_3',
            name: 'Process',
            input: {
              long_text: longString,
            },
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 200,
          output_tokens: 100,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('...');
    expect(result).not.toContain(longString);
  });

  it('should handle null/undefined tool parameters', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant',
      message: {
        id: 'msg_edge',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'tool_use',
            id: 'tool_edge',
            name: 'ProcessData',
            input: {
              value: null,
              optional_value: undefined,
              number_value: 42,
              boolean_value: true,
              string_value: 'test',
            },
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const result = formatMessage(message);

    expect(result).toContain('value: null');
    expect(result).toContain('optional_value: undefined');
    expect(result).toContain('number_value: 42');
    expect(result).toContain('boolean_value: true');
    expect(result).toContain('string_value: "test"');
  });
});
