# claude-pretty-printer

Beautiful CLI formatting for Claude Agent SDK messages with colors and boxes.

<img width="888" height="335" alt="Screenshot 2025-10-24 at 23 46 21" src="https://github.com/user-attachments/assets/34649b1c-c530-4ede-b2d6-33df8e8f04c5" />

![npm version](https://img.shields.io/npm/v/claude-pretty-printer)
![license](https://img.shields.io/npm/l/claude-pretty-printer)

## Features

- 🎨 **Beautiful Colors** - Syntax highlighting with picocolors
- 📦 **Terminal Boxes** - Full-width boxes that adapt to your terminal
- 🔍 **Smart Formatting** - Intelligent formatting for all message types
- 🚀 **Type-Safe** - Full TypeScript support
- 💡 **Lightweight** - Minimal dependencies

## Installation

```bash
npm install claude-pretty-printer
```

```bash
bun add claude-pretty-printer
```

## Usage

```typescript
import { formatMessage } from 'claude-pretty-printer';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Format a single message
for await (const message of query({ prompt: 'Hello!' })) {
  console.log(formatMessage(message));
}

// Format multiple messages
const messages = [];
for await (const message of query({ prompt: 'Hello!' })) {
  messages.push(message);
}
messages.forEach(message => console.log(formatMessage(message)));
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

### `formatMessage(message, showBox?)`

Formats a single SDK message for beautiful CLI output.

**Parameters:**
- `message: SDKMessage` - The message to format
- `showBox?: boolean` - Whether to wrap in a box (default: `true`)

**Returns:** `string` - Formatted message ready for console output

**Example - Processing multiple messages:**
```typescript
const messages = await getMessages();
messages.forEach(message => {
  console.log(formatMessage(message));
});
```

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

## Testing

This package includes comprehensive unit tests that cover:

- ✅ All message types (assistant, user, result, system, stream events)
- ✅ Tool result detection and special headers
- ✅ Edge cases and error handling
- ✅ Integration scenarios
- ✅ Various content formats and parameter types

Run the test suite with `bun test` to verify everything works correctly.

## License

MIT © Pepijn Senders

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [@anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) - Official Claude Agent SDK
- [picocolors](https://www.npmjs.com/package/picocolors) - Minimal terminal colors library
