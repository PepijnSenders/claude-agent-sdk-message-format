import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../../src/index';

describe('Result Message Formatting', () => {
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

  it('should format success results', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'result',
      subtype: 'success',
      duration_ms: 5000,
      duration_api_ms: 3000,
      is_error: false,
      num_turns: 5,
      result: 'Task completed successfully',
      total_cost_usd: 0.0123,
      usage: {
        input_tokens: 5000,
        output_tokens: 1200,
        cache_read_input_tokens: 1000,
        cache_creation_input_tokens: 500,
      },
      modelUsage: {
        'claude-3-sonnet': {
          inputTokens: 5000,
          outputTokens: 1200,
          cacheReadInputTokens: 1000,
          cacheCreationInputTokens: 500,
          webSearchRequests: 0,
          costUSD: 0.0123,
          contextWindow: 200000,
        },
      },
      permission_denials: [],
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ RESULT');
    expect(result).toContain('✓ Task completed successfully');
    expect(result).toContain('Duration: 5.00s');
    expect(result).toContain('API Time: 3.00s');
    expect(result).toContain('Turns: 5');
    expect(result).toContain('Cost: $0.0123');
    expect(result).toContain('Input: 5,000');
    expect(result).toContain('Output: 1,200');
    expect(result).toContain('Cache Read: 1,000');
    expect(result).toContain('Cache Creation: 500');
  });

  it('should format error results', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'result',
      subtype: 'error_max_turns',
      duration_ms: 10000,
      duration_api_ms: 8000,
      is_error: true,
      num_turns: 50,
      total_cost_usd: 0.1234,
      usage: {
        input_tokens: 25000,
        output_tokens: 5000,
      },
      modelUsage: {},
      permission_denials: [],
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ RESULT');
    expect(result).toContain('✗ Error: Maximum turns reached');
    expect(result).toContain('Duration: 10.00s');
    expect(result).toContain('Cost: $0.1234');
  });

  it('should format permission denials', () => {
    const message: SDKMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'result',
      subtype: 'success',
      duration_ms: 2000,
      duration_api_ms: 1500,
      is_error: false,
      num_turns: 3,
      result: 'Task completed',
      total_cost_usd: 0.005,
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
      },
      modelUsage: {},
      permission_denials: [
        {
          tool_name: 'FileSystem',
          tool_use_id: 'tool_dangerous',
          tool_input: {},
        },
      ] as any,
    };

    const result = formatMessage(message);

    expect(result).toContain('◆ RESULT');
    expect(result).toContain('Permission Denials: 1');
    expect(result).toContain('• FileSystem (tool_dangerous)');
  });
});
