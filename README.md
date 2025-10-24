# @pepijnsenders/claude-agent-sdk-message-format

Beautiful CLI formatting for Claude Agent SDK messages with colors and boxes.

![npm version](https://img.shields.io/npm/v/@pepijnsenders/claude-agent-sdk-message-format)
![license](https://img.shields.io/npm/l/@pepijnsenders/claude-agent-sdk-message-format)

## Features

- 🎨 **Beautiful Colors** - Syntax highlighting with picocolors
- 📦 **Terminal Boxes** - Full-width boxes that adapt to your terminal
- 🔍 **Smart Formatting** - Intelligent formatting for all message types
- 🚀 **Type-Safe** - Full TypeScript support
- 💡 **Lightweight** - Minimal dependencies

## Installation

```bash
npm install @pepijnsenders/claude-agent-sdk-message-format
```

```bash
bun add @pepijnsenders/claude-agent-sdk-message-format
```

## Usage

```typescript
import { formatSDKMessage, formatSDKMessages } from '@pepijnsenders/claude-agent-sdk-message-format';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Format a single message
for await (const message of query({ prompt: 'Hello!' })) {
  console.log(formatSDKMessage(message));
}

// Collect and format multiple messages
const messages = [];
for await (const message of query({ prompt: 'Hello!' })) {
  messages.push(message);
}
console.log(formatSDKMessages(messages));
```

## Message Types

### Assistant Messages
- **Blue header** with `◆ ASSISTANT`
- Text content and tool uses
- Thinking content (dimmed and italic)
- Tool parameters in clean key-value format

### User Messages
- **Green header** with `◆ USER`
- Text content and tool results
- Success/error indicators for tool execution

### Result Messages
- **Magenta header** with `◆ RESULT`
- Task completion status
- Detailed statistics (duration, cost, turns)
- Token usage breakdown
- Per-model usage information
- Permission denials (if any)

### System Messages
- **Yellow header** with `◆ SYSTEM`
- Session initialization details
- Conversation compaction notices
- Hook execution results

### Stream Events
Stream events are formatted inline without boxes for real-time output.

## API

### `formatSDKMessage(message, showBox?)`

Formats a single SDK message.

**Parameters:**
- `message: SDKMessage` - The message to format
- `showBox?: boolean` - Whether to wrap in a box (default: `true`)

**Returns:** `string` - Formatted message

### `formatSDKMessages(messages, showBoxes?)`

Formats multiple SDK messages in sequence.

**Parameters:**
- `messages: SDKMessage[]` - Array of messages to format
- `showBoxes?: boolean` - Whether to wrap each message in a box (default: `true`)

**Returns:** `string` - Formatted messages joined with newlines

## Color Scheme

- 🔵 **Blue** - Assistant messages
- 🟢 **Green** - User messages, success indicators
- 🟣 **Magenta** - Result messages
- 🟡 **Yellow** - System messages, costs
- 🔴 **Red** - Errors, permission denials
- 💙 **Cyan** - Tools, cache statistics, model names
- ⚫ **Dim** - Labels, secondary information

## Examples

### Tool Execution

```
────────────────────────────────────────────────────────────
◆ ASSISTANT
Let me read that file for you.

→ Read
  file_path: "/path/to/file.ts"
────────────────────────────────────────────────────────────
```

### Result Summary

```
────────────────────────────────────────────────────────────
◆ RESULT
✓ Task completed successfully

Result: File successfully read and processed

Statistics:
  Duration: 5.43s
  API Time: 3.21s
  Turns: 3
  Cost: $0.0123

Token Usage:
  Input: 5,000
  Output: 1,200
  Cache Read: 2,000
  Cache Creation: 1,000
────────────────────────────────────────────────────────────
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run tests
bun test
```

## License

MIT © Pepijn Senders

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [@anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) - Official Claude Agent SDK
- [picocolors](https://www.npmjs.com/package/picocolors) - Minimal terminal colors library
