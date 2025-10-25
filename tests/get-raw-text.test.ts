import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { getRawText } from '../src/index';

describe('getRawText', () => {
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
    });
  });

  it('should extract text from assistant text message', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant' as const,
      message: {
        role: 'assistant' as const,
        content: { type: 'text', text: 'Hello world' },
      },
      parent_tool_use_id: null,
    };

    expect(getRawText(message)).toBe('Hello world');
  });

  it('should extract tool name from assistant tool_use message', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant' as const,
      message: {
        role: 'assistant' as const,
        content: { type: 'tool_use', name: 'read_file', input: { path: 'test.txt' } },
      },
      parent_tool_use_id: null,
    };

    expect(getRawText(message)).toBe('[Tool: read_file]');
  });

  it('should handle mixed assistant content', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant' as const,
      message: {
        role: 'assistant' as const,
        content: [
          { type: 'text', text: 'First part' },
          { type: 'tool_use', name: 'think', input: { query: 'problem' } },
          { type: 'text', text: 'Second part' },
        ],
      },
      parent_tool_use_id: null,
    };

    expect(getRawText(message)).toBe('First part\nSecond part');
  });

  it('should extract text from user string message', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'User input here',
      },
      parent_tool_use_id: null,
    };

    expect(getRawText(message)).toBe('User input here');
  });

  it('should JSON stringify user object message', () => {
    const userContent = { type: 'multimodal', content: ['text', 'image'], query: 'test' };
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: userContent,
      },
      parent_tool_use_id: null,
    };

    expect(getRawText(message)).toBe(JSON.stringify(userContent));
  });

  it('should extract output from result message', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'result' as const,
      subtype: 'success' as const,
      duration_ms: 10.5,
      duration_api_ms: 8.0,
      is_error: false,
      num_turns: 1,
      result: 'Operation completed successfully',
      total_cost_usd: 0.123,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
      modelUsage: {
        'claude-3-sonnet': {
          inputTokens: 100,
          outputTokens: 50,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
          webSearchRequests: 0,
          costUSD: 0.123,
          contextWindow: 200000,
        },
      },
      permission_denials: [],
      parent_tool_use_id: 'tool-123',
    };

    expect(getRawText(message)).toBe('Operation completed successfully');
  });

  it('should JSON stringify result object output', () => {
    const output = { data: [1, 2, 3], status: 'ok' };
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'result' as const,
      subtype: 'success' as const,
      duration_ms: 5.2,
      duration_api_ms: 4.0,
      is_error: false,
      num_turns: 1,
      result: JSON.stringify(output),
      total_cost_usd: 0.456,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
      modelUsage: {
        'claude-3-sonnet': {
          inputTokens: 100,
          outputTokens: 50,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
          webSearchRequests: 0,
          costUSD: 0.456,
          contextWindow: 200000,
        },
      },
      permission_denials: [],
      parent_tool_use_id: 'tool-123',
    };

    expect(getRawText(message)).toBe(JSON.stringify(output));
  });

  it('should return system text', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system' as const,
      system: 'You are a helpful assistant.',
    };

    expect(getRawText(message)).toBe('You are a helpful assistant.');
  });

  it('should return empty string for system with null content', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system' as const,
      system: null,
    };

    expect(getRawText(message)).toBe('');
  });

  it('should extract text from text_delta stream event', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'stream_event' as const,
      event: {
        type: 'text_delta',
        delta: { text: 'Partial content' },
      },
    };

    expect(getRawText(message)).toBe('Partial content');
  });

  it('should extract JSON from input_json_delta stream event', () => {
    const partialJson = { status: 'processing', data: 'chunk' };
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'stream_event' as const,
      event: {
        type: 'input_json_delta',
        delta: { partial_json: partialJson },
      },
    };

    expect(getRawText(message)).toBe('{"status":"processing","data":"chunk"}');
  });

  it('should return empty string for unknown message types', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'system' as const,
    } as any;

    expect(getRawText(message)).toBe('');
  });
});
