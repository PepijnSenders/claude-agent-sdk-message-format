import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage, getRawText } from '../src/index';

describe('Integration Tests', () => {
  // Mock process.stdout.columns for consistent testing
  const originalColumns = process.stdout.columns;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    // Set a fixed width for consistent test output
    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      writable: true,
    });
    // Disable TTY to disable colors in tests
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original columns and TTY
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      writable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
    });
  });
  it('should work with a typical conversation flow', () => {
    // Simulate a typical conversation with user message, assistant tool use, and tool result

    const userMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Please read the package.json file for me',
      },
      parent_tool_use_id: null,
    };

    const assistantMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant' as const,
      message: {
        id: 'msg_1',
        type: 'message' as const,
        role: 'assistant' as const,
        model: 'claude-3-sonnet',
        content: [
          {
            type: 'text' as const,
            text: "I'll read the package.json file for you.",
          },
          {
            type: 'tool_use' as const,
            id: 'tool_1',
            name: 'Read',
            input: {
              file_path: './package.json',
            },
          },
        ],
        stop_reason: 'tool_use' as const,
        stop_sequence: null,
        usage: {
          input_tokens: 150,
          output_tokens: 75,
        },
      } as any,
      parent_tool_use_id: null,
    };

    const toolResultMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: 'tool_1',
            content: JSON.stringify(
              {
                name: 'test-package',
                version: '1.0.0',
                scripts: {
                  test: 'bun test',
                  build: 'bun run build',
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

    const userResult = formatMessage(userMessage);
    const assistantResult = formatMessage(assistantMessage);
    const toolResultResult = formatMessage(toolResultMessage);

    // Verify user message
    expect(userResult).toContain('◆ USER');
    expect(userResult).toContain('Please read the package.json file for me');
    expect(userResult).not.toContain('(Tool Results)');

    // Verify assistant message
    expect(assistantResult).toContain('◆ ASSISTANT');
    expect(assistantResult).toContain("I'll read the package.json file for you");
    expect(assistantResult).toContain('→ Read');
    expect(assistantResult).toContain('file_path: "./package.json"');

    // Verify tool result message
    expect(toolResultResult).toContain('◆ USER (Tool Results)');
    expect(toolResultResult).toContain('✓ Tool result: tool_1');
    expect(toolResultResult).toContain('test-package');
    expect(toolResultResult).toContain('1.0.0');
  });

  it('should handle multiple tool results in one message', () => {
    const multiToolMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: 'tool_1',
            content: 'First tool completed successfully',
            is_error: false,
          },
          {
            type: 'tool_result' as const,
            tool_use_id: 'tool_2',
            content: 'Second tool failed',
            is_error: true,
          },
        ],
      },
      parent_tool_use_id: null,
    };

    const result = formatMessage(multiToolMessage);

    expect(result).toContain('◆ USER (Tool Results)');
    expect(result).toContain('✓ Tool result: tool_1');
    expect(result).toContain('✗ Tool result: tool_2');
    expect(result).toContain('First tool completed successfully');
    expect(result).toContain('Second tool failed');
    expect(result).toContain('✗ Error in tool execution');
  });

  it('should handle processing multiple messages in sequence', () => {
    const messages = [
      {
        uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
        session_id: 'session-123',
        type: 'user' as const,
        message: { role: 'user' as const, content: 'Hello!' },
        parent_tool_use_id: null,
      },
      {
        uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
        session_id: 'session-123',
        type: 'assistant' as const,
        message: {
          id: 'msg_2',
          type: 'message' as const,
          role: 'assistant' as const,
          model: 'claude-3-sonnet',
          content: [{ type: 'text' as const, text: 'Hi there! How can I help you?' }],
          stop_reason: 'end_turn' as const,
          stop_sequence: null,
          usage: { input_tokens: 50, output_tokens: 25 },
        } as any,
        parent_tool_use_id: null,
      },
    ];

    const results = messages.map((msg) => formatMessage(msg));

    expect(results).toHaveLength(2);
    expect(results[0]).toContain('◆ USER');
    expect(results[0]).toContain('Hello!');
    expect(results[1]).toContain('◆ ASSISTANT');
    expect(results[1]).toContain('Hi there! How can I help you?');
  });

  it('should work with getRawText for extracting raw content', () => {
    const userMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content: 'Extract this content please',
      },
      parent_tool_use_id: null,
    };

    const assistantMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'assistant' as const,
      message: {
        role: 'assistant' as const,
        content: { type: 'text', text: 'I extracted: test data' },
      },
      parent_tool_use_id: null,
    };

    const resultMessage = {
      uuid: uuidv4() as `${string}-${string}-${string}-${string}`,
      session_id: 'session-123',
      type: 'result' as const,
      result: {
        type: 'success' as const,
        output: { extracted: 'test data', count: 42 },
      },
      parent_tool_use_id: 'tool-123',
    };

    // Test getRawText functionality
    expect(getRawText(userMessage)).toBe('Extract this content please');
    expect(getRawText(assistantMessage)).toBe('I extracted: test data');
    expect(getRawText(resultMessage)).toBe(JSON.stringify({ extracted: 'test data', count: 42 }));

    // Ensure both functions work together
    const rawTexts = [userMessage, assistantMessage, resultMessage].map(getRawText);
    expect(rawTexts).toEqual([
      'Extract this content please',
      'I extracted: test data',
      JSON.stringify({ extracted: 'test data', count: 42 }),
    ]);
  });
});
