import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import pc from 'picocolors';

export function formatStreamEvent(message: Extract<SDKMessage, { type: 'stream_event' }>): string {
  const event = message.event;

  switch (event.type) {
    case 'message_start':
      return ''; // Usually handled at the beginning

    case 'content_block_start':
      if (event.content_block.type === 'tool_use') {
        return `\n${pc.dim(`[Starting tool: ${event.content_block.name}]`)}`;
      }
      return '';

    case 'content_block_delta':
      if (event.delta.type === 'text_delta') {
        return event.delta.text;
      }
      if (event.delta.type === 'input_json_delta') {
        return event.delta.partial_json;
      }
      return '';

    case 'content_block_stop':
      return ''; // Usually handled at block completion

    case 'message_delta':
      return ''; // Usage updates, typically silent

    case 'message_stop':
      return ''; // End of message, typically handled elsewhere

    default:
      return '';
  }
}
