import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import pc from 'picocolors';
import {
  formatAssistantMessage,
  formatResultMessage,
  formatStreamEvent,
  formatSystemMessage,
  formatUserMessage,
} from './formatters';
import { createBox } from './utils';
import { validateMessage } from './validation';

/**
 * Extracts raw text content from any SDK message type
 * @param message The SDK message to extract content from
 * @returns Raw text content as string, or empty string if no content
 */
export function getRawText(message: SDKMessage): string {
  switch (message.type) {
    case 'assistant':
      if (message.message.content.type === 'text') {
        return message.message.content.text;
      }
      if (message.message.content.type === 'tool_use') {
        return `[Tool: ${message.message.content.name}]`;
      }
      // For assistant messages with mixed content, join text blocks
      if (Array.isArray(message.message.content)) {
        return message.message.content
          .filter((block: { type: 'text' }) => (block as { type: 'text'; text: string }).text)
          .map((block: { type: 'text' }) => (block as { type: 'text'; text: string }).text)
          .join('\n');
      }
      return '';

    case 'user':
      if (message.message.role === 'user' && typeof message.message.content === 'string') {
        return message.message.content;
      }
      if (message.message.role === 'user' && typeof message.message.content === 'object') {
        return JSON.stringify(message.message.content);
      }
      return '';

    case 'result': {
      const resultMsg = message as any;
      if (resultMsg.result) {
        return typeof resultMsg.result === 'string'
          ? resultMsg.result
          : JSON.stringify(resultMsg.result);
      }
      return '';
    }

    case 'system':
      return 'system' in message && (message as any).system ? (message as any).system : '';

    case 'stream_event':
      // For streaming events, extract actual text content
      if (message.event.type === 'text_delta' && message.event.delta?.text) {
        return message.event.delta.text;
      }
      if (message.event.type === 'input_json_delta' && message.event.delta?.partial_json) {
        return JSON.stringify(message.event.delta.partial_json);
      }
      return '';

    default:
      if ('type' in message) {
        return ''; // Unknown but valid type
      }
      return ''; // Completely unknown type
  }
}

/**
 * Formats an SDKMessage for CLI output with colors and boxes
 * @param message The SDK message to format
 * @param showBox Whether to wrap the message in a box (default: true)
 * @returns Formatted string ready for CLI display
 */
export function formatMessage(message: SDKMessage, showBox = true): string {
  // Validate the message has required fields
  validateMessage(message);

  let content: string;
  let header: string;

  switch (message.type) {
    case 'assistant': {
      header = pc.blue('◆ ASSISTANT');
      content = formatAssistantMessage(message);
      break;
    }
    case 'user': {
      const userResult = formatUserMessage(message);
      header = userResult.header;
      content = userResult.content;
      break;
    }
    case 'result': {
      header = pc.magenta('◆ RESULT');
      content = formatResultMessage(message);
      break;
    }
    case 'system': {
      header = pc.yellow('◆ SYSTEM');
      content = formatSystemMessage(message);
      break;
    }
    case 'stream_event': {
      // Stream events don't get boxes
      return formatStreamEvent(message);
    }
    default: {
      header = pc.red('◆ UNKNOWN');
      content = `[Unknown message type: ${(message as any).type}]`;
      break;
    }
  }

  // Skip box for empty content or stream events
  if (!showBox || !content || content.trim().length === 0) {
    return content;
  }

  return createBox(header, content);
}
