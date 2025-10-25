import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';

/**
 * Validates required fields for different message types
 * @param message The SDK message to validate
 * @throws Error with helpful message if required fields are missing
 */
export function validateMessage(message: SDKMessage): void {
  switch (message.type) {
    case 'result':
      validateResultMessage(message);
      break;
    case 'assistant':
      validateAssistantMessage(message);
      break;
    case 'user':
      validateUserMessage(message);
      break;
  }
}

/**
 * Validates required fields for result messages
 */
function validateResultMessage(message: Extract<SDKMessage, { type: 'result' }>): void {
  const requiredFields = [
    'duration_ms',
    'total_cost_usd',
    'usage',
    'num_turns',
    'session_id',
    'uuid',
  ];
  const missingFields = requiredFields.filter((field) => !(field in message));

  if (missingFields.length > 0) {
    throw new Error(
      `Result messages require these fields: ${missingFields.join(', ')}.\n` +
        `Example: npx claude-pretty-printer '${JSON.stringify({
          type: 'result',
          subtype: 'success',
          duration_ms: 500,
          duration_api_ms: 400,
          num_turns: 1,
          result: 'Task completed successfully',
          session_id: 'test-123',
          total_cost_usd: 0.005,
          usage: { input_tokens: 100, output_tokens: 50 },
          modelUsage: {},
          permission_denials: [],
          uuid: '550e8400-e29b-41d4-a716-446655440000',
        })}'`
    );
  }
}

/**
 * Validates required fields for assistant messages
 */
function validateAssistantMessage(message: Extract<SDKMessage, { type: 'assistant' }>): void {
  if (!message.message) {
    throw new Error('Assistant messages require a "message" field with content');
  }
}

/**
 * Validates required fields for user messages
 */
function validateUserMessage(message: Extract<SDKMessage, { type: 'user' }>): void {
  if (!message.message) {
    throw new Error('User messages require a "message" field with content');
  }
}
