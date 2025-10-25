# claude-pretty-printer

Transform raw Claude Agent SDK messages into beautiful, readable CLI output.

<img width="888" height="335" alt="Screenshot 2025-10-24 at 23 46 21" src="https://github.com/user-attachments/assets/34649b1c-c530-4ede-b2d6-33df8e8f04c5" />

![npm version](https://img.shields.io/npm/v/claude-pretty-printer)
![license](https://img.shields.io/npm/l/claude-pretty-printer)

## The Problem

The [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) outputs raw JSON messages that are difficult to read and debug:

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "type": "assistant",
  "message": {
    "id": "msg_123",
    "role": "assistant",
    "content": [
      {"type": "text", "text": "Let me read that file for you."},
      {"type": "tool_use", "id": "tool_456", "name": "Read", "input": {"file_path": "/path/to/file.txt"}}
    ]
  }
}
```

## The Solution

`claude-pretty-printer` transforms these raw messages into clean, readable output:

```
────────────────────────────────────────────────────────────
◆ ASSISTANT
Let me read that file for you.

→ Read
  file_path: "/path/to/file.txt"
────────────────────────────────────────────────────────────
```

## Features

- 🎨 **Syntax Highlighting** - Clear colors and formatting for different message types
- 📦 **Terminal Boxes** - Full-width boxes that adapt to your terminal size
- 🔍 **Smart Detection** - Automatically formats all message types from the SDK
- 🚀 **Type-Safe** - Full TypeScript support with proper types
- 💡 **Developer-Focused** - Built for debugging and monitoring Claude Agent interactions

## Installation

```bash
npm install claude-pretty-printer
```

```bash
bun add claude-pretty-printer
```

## Usage

### Programmatic API

Perfect for debugging, monitoring, or building CLI tools that work with the Claude Agent SDK:

```typescript
import { formatMessage } from 'claude-pretty-printer';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Real-time message formatting during agent execution
for await (const message of query({ prompt: 'Read package.json' })) {
  console.log(formatMessage(message));
}

// Batch processing of collected messages
const messages = await getAgentMessages();
messages.forEach(message => console.log(formatMessage(message)));
```

### Hook Helpers

Add beautiful formatted logging to your hooks with the `withLogging()` wrapper - an invisible enhancement that preserves your original hook configuration:

```typescript
import { withLogging } from 'claude-pretty-printer/hooks';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Simple - just add logging to empty hooks
const hooks = withLogging({
  PreToolUse: [{}],
  PostToolUse: [{}],
});

// Use them in your agent
for await (const message of query({
  prompt: 'Read package.json',
  hooks,
})) {
  console.log(formatMessage(message));
}
```

**Enhancing Existing Hooks:**

The power of `withLogging()` is that it wraps your existing hooks transparently:

```typescript
import { withLogging } from 'claude-pretty-printer/hooks';

// Your original hooks with custom logic
const hooks = withLogging({
  PreToolUse: [
    {
      matcher: '.*',
      hooks: [
        async (input, toolUseID, options) => {
          // Your custom pre-tool logic here
          console.log('About to execute:', input.name);
          return {};
        },
      ],
    },
  ],
  PostToolUse: [
    {
      matcher: 'Read|Write',
      hooks: [
        async (input, toolUseID, options) => {
          // Your custom post-tool logic here
          await logToDatabase(input);
          return {};
        },
      ],
    },
  ],
});

// Now you get both: formatted logging + your custom behavior!
```

**Custom Options:**

```typescript
import { withLogging } from 'claude-pretty-printer/hooks';
import fs from 'fs';

// Use a custom logger (e.g., write to file)
const hooks = withLogging(
  {
    PreToolUse: [{}],
    PostToolUse: [{}],
  },
  {
    logger: (msg) => fs.appendFileSync('hooks.log', msg + '\n'),
  }
);

// Use raw JSON output instead of formatted
const hooks = withLogging(
  {
    PreToolUse: [{}],
  },
  {
    formatted: false, // Outputs JSON instead of formatted text
  }
);

// Mix and match - some with logging, some without
const hooks = {
  ...withLogging({
    PreToolUse: [{}],
    PostToolUse: [{}],
  }),
  // These won't have automatic logging
  Notification: [
    {
      matcher: '.*',
      hooks: [async (input) => {
        // Your custom notification handler
        return {};
      }],
    },
  ],
};
```

**Alternative: Create Hooks from Scratch**

If you prefer to create logging hooks without wrapping existing ones:

```typescript
import { createLoggingHooks, createSingleLoggingHook } from 'claude-pretty-printer/hooks';

// Create formatted logging hooks for all hook types
const hooks = createLoggingHooks();

// Or create specific hook types only
const hooks = createLoggingHooks({
  hookTypes: ['PreToolUse', 'PostToolUse'],
  matcher: 'Read|Write', // Only match specific tools
});
```

**Available Hook Types:**
- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool execution
- `Notification` - System notifications
- `UserPromptSubmit` - User prompt submissions
- `SessionStart` - Session initialization
- `SessionEnd` - Session termination
- `Stop` - Stop hook triggers
- `SubagentStop` - Subagent stop triggers
- `PreCompact` - Before conversation compaction

### Command Line Interface

Transform JSON output directly from Claude CLI or any other source:

```bash
# Read from stdin (pipe from Claude CLI)
claude -p --output-format json --dangerously-skip-permissions "test" | npx claude-pretty-printer

# Read from file (multi-line JSON)
npx claude-pretty-printer messages.txt

# Inline JSON (single message)
npx claude-pretty-printer '{"type":"assistant","message":{"content":"Hello"}}'

# Format from file with relative path
npx claude-pretty-printer ./data/messages.json

# Show help
npx claude-pretty-printer --help
```

**Input Methods:**
- **Stdin**: Pipe JSON messages line by line (default behavior)
- **File**: Read multi-line JSON from a file (one message per line)
- **Inline**: Format single JSON object as argument

**CLI Input Format**: Each line should be a complete JSON object representing an SDK message. The CLI automatically detects the input method based on how you call it.

## What It Formats

`claude-pretty-printer` handles all message types from the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk):

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

### Hook Callback Messages
Specialized formatting for all Claude Agent SDK hook callbacks:

- **🔧 PreToolUse** - Shows tool name and input parameters before execution
- **✅ PostToolUse** - Displays tool response after execution (with truncation for long responses)
- **🔔 Notification** - Shows notifications with optional titles and messages
- **📝 UserPromptSubmit** - Displays user prompt submissions (with preview for long prompts)
- **🚀 SessionStart** - Shows session startup with source type (startup/resume/clear/compact)
- **🛑 SessionEnd** - Displays session termination with exit reason
- **⏸️/🛑 Stop** - Shows stop hook triggers (active/inactive state)
- **⏸️/🛑 SubagentStop** - Shows subagent stop hook triggers
- **👆/🤖 PreCompact** - Shows pre-compaction events with trigger type (manual/auto) and custom instructions

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

### Hook Callback Examples

#### PreToolUse Hook
```
🔧 Pre-Tool Use: Bash
   Working directory: /Users/ps/Documents/GitHub/claude-agent-sdk-message-format

Tool input:
  {
    "command": "echo \"hello world\""
  }
```

#### PostToolUse Hook
```
✅ Post-Tool Use: Read
   Working directory: /Users/ps/Documents/GitHub/claude-agent-sdk-message-format

Tool response:
  {
    "content": "File content here"
  }
```

#### SessionStart Hook
```
🚀 Session Started (startup)
   Transcript: /path/to/transcript.json
   Working directory: /Users/ps/Documents/GitHub/claude-agent-sdk-message-format
   Permission mode: default
```

#### Notification Hook
```
🔔 Notification
   Build Completed

Message:
  Your build has completed successfully

   Location: /Users/ps/Documents/GitHub/claude-agent-sdk-message-format
```

## Development

```bash
bun install     # Install dependencies
bun run build  # Build the package
bun test        # Run comprehensive test suite
```

## Testing

Comprehensive test suite covering all SDK message types, edge cases, and integration scenarios. Run with `bun test`.

## License

MIT © Pepijn Senders

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [@anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) - Official Claude Agent SDK
- [picocolors](https://www.npmjs.com/package/picocolors) - Minimal terminal colors library
