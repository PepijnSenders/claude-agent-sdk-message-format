/**
 * Basic usage example for claude-pretty-printer
 *
 * Run: bun examples/basic.ts
 */

import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { formatMessage } from '../src/index';

// Example assistant message with tool use
const assistantMessage: SDKMessage = {
  uuid: '123e4567-e89b-12d3-a456-426614174000' as any,
  session_id: 'session-123',
  type: 'assistant',
  message: {
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    content: [
      {
        type: 'text',
        text: 'Let me help you read that file.',
      },
      {
        type: 'tool_use',
        id: 'tool_123',
        name: 'Read',
        input: {
          file_path: '/Users/example/project/package.json',
        },
      },
    ],
    stop_reason: 'tool_use',
    stop_sequence: null,
    usage: {
      input_tokens: 1000,
      output_tokens: 50,
    },
  } as any,
  parent_tool_use_id: null,
};

// Example user message with tool result
const userMessage: SDKMessage = {
  uuid: '123e4567-e89b-12d3-a456-426614174001' as any,
  session_id: 'session-123',
  type: 'user',
  message: {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'tool_123',
        content: JSON.stringify(
          {
            name: 'my-app',
            version: '1.0.0',
            dependencies: {
              picocolors: '^1.1.1',
            },
          },
          null,
          2
        ),
        is_error: false,
      },
    ],
  },
  parent_tool_use_id: null,
};

// Example result message
const resultMessage: SDKMessage = {
  uuid: '123e4567-e89b-12d3-a456-426614174002' as any,
  session_id: 'session-123',
  type: 'result',
  subtype: 'success',
  duration_ms: 5432,
  duration_api_ms: 3210,
  is_error: false,
  num_turns: 3,
  result: 'Successfully read and analyzed package.json',
  total_cost_usd: 0.0123,
  usage: {
    input_tokens: 5000,
    output_tokens: 1200,
    cache_creation_input_tokens: 1000,
    cache_read_input_tokens: 2000,
  },
  modelUsage: {
    'claude-sonnet-4-5': {
      inputTokens: 5000,
      outputTokens: 1200,
      cacheReadInputTokens: 2000,
      cacheCreationInputTokens: 1000,
      webSearchRequests: 0,
      costUSD: 0.0123,
      contextWindow: 200000,
    },
  },
  permission_denials: [],
};

console.log('='.repeat(80));
console.log('CLAUDE PRETTY PRINTER - EXAMPLE OUTPUT');
console.log('='.repeat(80));
console.log();

console.log(formatMessage(assistantMessage));
console.log();

console.log(formatMessage(userMessage));
console.log();

console.log(formatMessage(resultMessage));
