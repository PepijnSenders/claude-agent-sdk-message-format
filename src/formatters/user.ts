import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import pc from 'picocolors';

export function formatUserMessage(message: Extract<SDKMessage, { type: 'user' }>): {
  header: string;
  content: string;
} {
  if ('isReplay' in message && message.isReplay) {
    return { header: '', content: '' }; // Skip replay messages to avoid duplication
  }

  const content = message.message.content;
  const lines: string[] = [];
  let hasToolResults = false;

  if (typeof content === 'string') {
    lines.push(content);
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'string') {
        lines.push(block);
      } else if (block.type === 'text') {
        lines.push(block.text);
      } else if (block.type === 'image') {
        lines.push(pc.dim('[Image]'));
      } else if (block.type === 'tool_result') {
        hasToolResults = true;
        const resultIcon = block.is_error ? pc.red('✗') : pc.green('✓');
        lines.push(`\n${resultIcon} ${pc.dim(`Tool result: ${block.tool_use_id}`)}`);
        if (typeof block.content === 'string') {
          lines.push(block.content);
        } else if (Array.isArray(block.content)) {
          for (const contentBlock of block.content) {
            if (contentBlock.type === 'text') {
              lines.push(contentBlock.text);
            } else if (contentBlock.type === 'image') {
              lines.push(pc.dim('[Image result]'));
            }
          }
        }
        if (block.is_error) {
          lines.push(pc.red('✗ Error in tool execution'));
        }
      }
    }
  }

  const contentText = message.isSynthetic
    ? `${pc.dim('[Synthetic]')} ${lines.join('\n')}`
    : lines.join('\n');

  // Choose header based on whether there are tool results
  const header = hasToolResults ? pc.green('◆ USER (Tool Results)') : pc.green('◆ USER');

  return { header, content: contentText };
}
