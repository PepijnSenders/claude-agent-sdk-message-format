import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { formatMessage } from '../src/index';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';

// Helper function to generate proper UUID v4 format
function createTestUUID(seed: number): string {
  // Generate a consistent UUID based on the seed number
  const hex = (seed + 0x550e8400e29b41d4).toString(16).padStart(16, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}466655440000`;
}

describe('formatMessage', () => {
  // Mock process.stdout.columns for consistent testing
  const originalColumns = process.stdout.columns;

  beforeEach(() => {
    // Set a fixed width for consistent test output
    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original columns
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      writable: true,
    });
  });

  describe('Assistant Messages', () => {
    it('should format text content', () => {
      const message: SDKMessage = {
        uuid: createTestUUID(1),
        session_id: 'session-123',
        type: 'assistant',
        message: {
          id: 'msg_1',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet',
          content: [
            {
              type: 'text',
              text: 'Hello! How can I help you today?'
            }
          ],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        } as any,
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ ASSISTANT');
      expect(result).toContain('Hello! How can I help you today?');
      expect(result).toContain('─');
    });

    it('should format tool use blocks', () => {
      const message: SDKMessage = {
        uuid: createTestUUID(2),
        session_id: 'session-123',
        type: 'assistant',
        message: {
          id: 'msg_2',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet',
          content: [
            {
              type: 'text',
              text: 'Let me read that file for you.'
            },
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'Read',
              input: {
                file_path: '/path/to/file.txt'
              }
            }
          ],
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: {
            input_tokens: 150,
            output_tokens: 75,
          },
        } as any,
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ ASSISTANT');
      expect(result).toContain('Let me read that file for you.');
      expect(result).toContain('→ Read');
      expect(result).toContain('file_path: "/path/to/file.txt"');
    });

    it('should format thinking content', () => {
      const message: SDKMessage = {
        uuid: createTestUUID('000000000003'),
        session_id: 'session-123',
        type: 'assistant',
        message: {
          id: 'msg_3',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet',
          content: [
            {
              type: 'text',
              text: 'I need to analyze this carefully.'
            }
          ],
          thinking: [
            {
              type: 'text',
              text: 'Let me think about the best approach here...'
            }
          ],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: 200,
            output_tokens: 100,
          },
        } as any,
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ ASSISTANT');
      expect(result).toContain('I need to analyze this carefully.');
      expect(result).toContain('[Thinking]');
      expect(result).toContain('Let me think about the best approach here...');
    });

    it('should format complex tool parameters', () => {
      const message: SDKMessage = {
        uuid: 'test-assistant-4',
        session_id: 'session-123',
        type: 'assistant',
        message: {
          id: 'msg_4',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet',
          content: [
            {
              type: 'tool_use',
              id: 'tool_2',
              name: 'Write',
              input: {
                file_path: '/path/to/file.ts',
                content: 'console.log("Hello, World!");',
                options: {
                  overwrite: true,
                  create_dirs: true
                }
              }
            }
          ],
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: {
            input_tokens: 180,
            output_tokens: 90,
          },
        } as any,
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('→ Write');
      expect(result).toContain('file_path: "/path/to/file.ts"');
      expect(result).toContain('options:'); // Complex objects are formatted as JSON
    });

    it('should truncate very long strings in tool parameters', () => {
      const longString = 'x'.repeat(150);
      const message: SDKMessage = {
        uuid: 'test-assistant-5',
        session_id: 'session-123',
        type: 'assistant',
        message: {
          id: 'msg_5',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet',
          content: [
            {
              type: 'tool_use',
              id: 'tool_3',
              name: 'Process',
              input: {
                long_text: longString
              }
            }
          ],
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: {
            input_tokens: 200,
            output_tokens: 100,
          },
        } as any,
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('...');
      expect(result).not.toContain(longString); // Should be truncated
    });
  });

  describe('User Messages', () => {
    it('should format simple text messages', () => {
      const message: SDKMessage = {
        uuid: 'test-user-1',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'Can you help me with my code?'
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ USER');
      expect(result).toContain('Can you help me with my code?');
      expect(result).not.toContain('(Tool Results)');
    });

    it('should format messages with tool results with special header', () => {
      const message: SDKMessage = {
        uuid: 'test-user-2',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool_1',
              content: 'File content here',
              is_error: false
            }
          ]
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ USER (Tool Results)');
      expect(result).toContain('✓ Tool result: tool_1');
      expect(result).toContain('File content here');
    });

    it('should format tool results with errors', () => {
      const message: SDKMessage = {
        uuid: 'test-user-3',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool_2',
              content: 'File not found',
              is_error: true
            }
          ]
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ USER (Tool Results)');
      expect(result).toContain('✗ Tool result: tool_2');
      expect(result).toContain('File not found');
      expect(result).toContain('✗ Error in tool execution');
    });

    it('should format mixed content with text and tool results', () => {
      const message: SDKMessage = {
        uuid: 'test-user-4',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: [
            'Here is the result of my analysis:',
            {
              type: 'tool_result',
              tool_use_id: 'tool_3',
              content: 'Analysis completed successfully',
              is_error: false
            }
          ]
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ USER (Tool Results)');
      expect(result).toContain('Here is the result of my analysis:');
      expect(result).toContain('✓ Tool result: tool_3');
    });

    it('should format synthetic user messages', () => {
      const message: SDKMessage = {
        uuid: 'test-user-5',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'This is a synthetic message'
        },
        parent_tool_use_id: null,
        isSynthetic: true,
      };

      const result = formatMessage(message);

      expect(result).toContain('[Synthetic]');
      expect(result).toContain('This is a synthetic message');
    });

    it('should skip replay messages', () => {
      const message: SDKMessage = {
        uuid: 'test-user-6',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'This should not appear'
        },
        parent_tool_use_id: null,
        isReplay: true,
      };

      const result = formatMessage(message);

      expect(result).toBe('');
    });
  });

  describe('Result Messages', () => {
    it('should format success results', () => {
      const message: SDKMessage = {
        uuid: 'test-result-1',
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
          }
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
        uuid: 'test-result-2',
        session_id: 'session-123',
        type: 'result',
        subtype: 'error_max_turns',
        duration_ms: 10000,
        duration_api_ms: 8000,
        is_error: true,
        num_turns: 50,
        result: '',
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
        uuid: 'test-result-3',
        session_id: 'session-123',
        type: 'result',
        subtype: 'success',
        duration_ms: 2000,
        duration_api_ms: 1500,
        is_error: false,
        num_turns: 3,
        result: 'Task completed',
        total_cost_usd: 0.0050,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
        modelUsage: {},
        permission_denials: [
          {
            tool_name: 'FileSystem',
            tool_use_id: 'tool_dangerous',
            tool_input: {}
          }
        ] as any,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ RESULT');
      expect(result).toContain('Permission Denials: 1');
      expect(result).toContain('• FileSystem (tool_dangerous)');
    });
  });

  describe('System Messages', () => {
    it('should format init messages', () => {
      const message: SDKMessage = {
        uuid: 'test-system-1',
        session_id: 'session-123',
        type: 'system',
        subtype: 'init',
        claude_code_version: '1.0.0',
        model: 'claude-3-sonnet',
        cwd: '/path/to/project',
        permissionMode: 'read',
        apiKeySource: 'env',
        tools: ['Read', 'Write', 'Bash'],
        mcp_servers: [
          {
            name: 'filesystem',
            status: 'connected',
          },
          {
            name: 'database',
            status: 'failed',
          },
        ],
        slash_commands: ['help', 'clear'],
        agents: ['code-analyzer'],
        skills: ['javascript', 'typescript'],
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ SYSTEM');
      expect(result).toContain('Claude Code Session Initialized');
      expect(result).toContain('Version: 1.0.0');
      expect(result).toContain('Model: claude-3-sonnet');
      expect(result).toContain('Working Directory: /path/to/project');
      expect(result).toContain('Permission Mode: read');
      expect(result).toContain('Available Tools: 3');
      expect(result).toContain('✓ filesystem (connected)');
      expect(result).toContain('✗ database (failed)');
      expect(result).toContain('Slash Commands: help, clear');
      expect(result).toContain('Agents: code-analyzer');
      expect(result).toContain('Skills: javascript, typescript');
    });

    it('should format compact boundary messages', () => {
      const message: SDKMessage = {
        uuid: 'test-system-2',
        session_id: 'session-123',
        type: 'system',
        subtype: 'compact_boundary',
        compact_metadata: {
          trigger: 'manual',
          pre_tokens: 150000,
        },
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ SYSTEM');
      expect(result).toContain('⚡ Conversation Compacted (manual)');
      expect(result).toContain('Previous tokens: 150,000');
    });

    it('should format hook responses', () => {
      const message: SDKMessage = {
        uuid: 'test-system-3',
        session_id: 'session-123',
        type: 'system',
        subtype: 'hook_response',
        hook_name: 'pre-execution',
        hook_event: 'before_tool_use',
        stdout: 'Hook executed successfully',
        stderr: 'Warning: deprecated API used',
        exit_code: 0,
      };

      const result = formatMessage(message);

      expect(result).toContain('◆ SYSTEM');
      expect(result).toContain('⚙ Hook: pre-execution (before_tool_use)');
      expect(result).toContain('stdout:');
      expect(result).toContain('Hook executed successfully');
      expect(result).toContain('stderr:');
      expect(result).toContain('Warning: deprecated API used');
      expect(result).toContain('✓ Exit code: 0');
    });
  });

  describe('Stream Events', () => {
    it('should format text delta events', () => {
      const message: SDKMessage = {
        uuid: 'test-stream-1',
        session_id: 'session-123',
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: {
            type: 'text_delta',
            text: 'Hello'
          }
        }
      };

      const result = formatMessage(message);

      expect(result).toBe('Hello');
      expect(result).not.toContain('◆');
      expect(result).not.toContain('─');
    });

    it('should format tool use start events', () => {
      const message: SDKMessage = {
        uuid: 'test-stream-2',
        session_id: 'session-123',
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: {
            type: 'tool_use',
            id: 'tool_1',
            name: 'Read'
          }
        }
      };

      const result = formatMessage(message);

      expect(result).toContain('[Starting tool: Read]');
    });

    it('should return empty string for events that should be silent', () => {
      const message: SDKMessage = {
        uuid: 'test-stream-3',
        session_id: 'session-123',
        type: 'stream_event',
        event: {
          type: 'message_start'
        }
      };

      const result = formatMessage(message);

      expect(result).toBe('');
    });
  });

  describe('Unknown Message Types', () => {
    it('should handle unknown message types gracefully', () => {
      const message = {
        uuid: createTestUUID('unknown1') as any,
        session_id: 'session-123',
        type: 'unknown_type' as any,
        message: {
          content: 'Unknown content'
        }
      } as any;

      const result = formatMessage(message);

      expect(result).toContain('◆ UNKNOWN');
      expect(result).toContain('[Unknown message type: unknown_type]');
    });
  });

  describe('Box Options', () => {
    it('should format without box when showBox is false', () => {
      const message: SDKMessage = {
        uuid: 'test-box-1',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'No box for this message'
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message, false);

      expect(result).toContain('No box for this message');
      expect(result).not.toContain('─');
      expect(result).not.toContain('◆ USER');
    });

    it('should format with box when showBox is true (default)', () => {
      const message: SDKMessage = {
        uuid: 'test-box-2',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'Box for this message'
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message, true);

      expect(result).toContain('Box for this message');
      expect(result).toContain('─');
      expect(result).toContain('◆ USER');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const message: SDKMessage = {
        uuid: 'test-empty-1',
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: ''
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      // Empty content should return empty (no box needed)
      expect(result).toBe('');
    });

    it('should handle null/undefined tool parameters', () => {
      const message: SDKMessage = {
        uuid: 'test-edge-1',
        session_id: 'session-123',
        type: 'assistant',
        message: {
          id: 'msg_edge',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet',
          content: [
            {
              type: 'tool_use',
              id: 'tool_edge',
              name: 'ProcessData',
              input: {
                value: null,
                optional_value: undefined,
                number_value: 42,
                boolean_value: true,
                string_value: 'test'
              }
            }
          ],
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        } as any,
        parent_tool_use_id: null,
      };

      const result = formatMessage(message);

      expect(result).toContain('value: null');
      expect(result).toContain('optional_value: undefined');
      expect(result).toContain('number_value: 42');
      expect(result).toContain('boolean_value: true');
      expect(result).toContain('string_value: "test"');
    });
  });
});