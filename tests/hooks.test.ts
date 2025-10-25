import { describe, expect, it, type Mock, mock } from 'bun:test';
import { createLoggingHooks, createSingleLoggingHook, withLogging } from '../src/hooks';

// Helper type for mock logger calls
type MockLogger = Mock<(message: string) => void>;
type MockCall = [string];

// Helper function to get the first call argument from a mock logger
function getFirstCallArg(mockLogger: MockLogger): string {
  expect(mockLogger).toHaveBeenCalled();
  expect(mockLogger.mock.calls.length).toBeGreaterThan(0);
  const calls = mockLogger.mock.calls as unknown as MockCall[];
  return calls[0][0];
}

describe('Hook Helpers', () => {
  describe('createLoggingHooks', () => {
    it('should create hooks for all default hook types', () => {
      const hooks = createLoggingHooks();

      expect(hooks.PreToolUse).toBeDefined();
      expect(hooks.PostToolUse).toBeDefined();
      expect(hooks.Notification).toBeDefined();
      expect(hooks.UserPromptSubmit).toBeDefined();
      expect(hooks.SessionStart).toBeDefined();
      expect(hooks.SessionEnd).toBeDefined();
      expect(hooks.Stop).toBeDefined();
      expect(hooks.SubagentStop).toBeDefined();
      expect(hooks.PreCompact).toBeDefined();
    });

    it('should create hooks with default matcher', () => {
      const hooks = createLoggingHooks();

      expect(hooks.PreToolUse).toHaveLength(1);
      expect(hooks.PreToolUse?.[0].matcher).toBe('.*');
      expect(hooks.PreToolUse?.[0].hooks).toHaveLength(1);
    });

    it('should create hooks with custom matcher', () => {
      const hooks = createLoggingHooks({ matcher: 'Read|Write' });

      expect(hooks.PreToolUse?.[0].matcher).toBe('Read|Write');
    });

    it('should create hooks for specific hook types only', () => {
      const hooks = createLoggingHooks({
        hookTypes: ['PreToolUse', 'PostToolUse'],
      });

      expect(hooks.PreToolUse).toBeDefined();
      expect(hooks.PostToolUse).toBeDefined();
      expect(hooks.Notification).toBeUndefined();
      expect(hooks.SessionStart).toBeUndefined();
    });

    it('should use custom logger when provided', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        hookTypes: ['PreToolUse'],
      });

      // Execute the hook
      await hooks.PreToolUse?.[0].hooks[0](
        { name: 'Read', input: { file_path: 'test.txt' } },
        'tool-123',
        { sessionId: 'test-session', cwd: '/test/path' }
      );

      expect(mockLogger).toHaveBeenCalled();
    });

    it('should format output when formatted is true', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        formatted: true,
        hookTypes: ['PreToolUse'],
      });

      await hooks.PreToolUse?.[0].hooks[0](
        { name: 'Read', input: { file_path: 'test.txt' } },
        'tool-123',
        { sessionId: 'test-session' }
      );

      // Check that formatted output was logged (should contain ANSI codes or formatted text)
      const loggedMessage = getFirstCallArg(mockLogger);
      expect(typeof loggedMessage).toBe('string');
      expect(loggedMessage.length).toBeGreaterThan(0);
    });

    it('should use JSON output when formatted is false', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        formatted: false,
        hookTypes: ['PreToolUse'],
      });

      await hooks.PreToolUse?.[0].hooks[0](
        { name: 'Read', input: { file_path: 'test.txt' } },
        'tool-123',
        { sessionId: 'test-session' }
      );

      // Check that JSON output was logged
      const loggedMessage = getFirstCallArg(mockLogger);
      expect(loggedMessage).toBeDefined();
      expect(() => JSON.parse(loggedMessage)).not.toThrow();
    });

    it('should return empty object from hook callback', async () => {
      const hooks = createLoggingHooks({ hookTypes: ['PreToolUse'] });

      const result = await hooks.PreToolUse?.[0].hooks[0]({}, null, {});

      expect(result).toEqual({});
    });
  });

  describe('createSingleLoggingHook', () => {
    it('should create a single hook type', () => {
      const hooks = createSingleLoggingHook('PreToolUse');

      expect(hooks.PreToolUse).toBeDefined();
      expect(hooks.PostToolUse).toBeUndefined();
      expect(hooks.Notification).toBeUndefined();
    });

    it('should work with custom options', () => {
      const hooks = createSingleLoggingHook('PostToolUse', {
        matcher: 'custom-pattern',
        formatted: false,
      });

      expect(hooks.PostToolUse).toBeDefined();
      expect(hooks.PostToolUse?.[0].matcher).toBe('custom-pattern');
    });

    it('should be composable with multiple single hooks', () => {
      const hooks = {
        ...createSingleLoggingHook('PreToolUse'),
        ...createSingleLoggingHook('PostToolUse'),
      };

      expect(hooks.PreToolUse).toBeDefined();
      expect(hooks.PostToolUse).toBeDefined();
      expect(hooks.Notification).toBeUndefined();
    });
  });

  describe('Hook-specific data handling', () => {
    it('should handle PreToolUse hook data', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        formatted: true,
        hookTypes: ['PreToolUse'],
      });

      await hooks.PreToolUse?.[0].hooks[0](
        { name: 'Bash', input: { command: 'ls -la' } },
        'tool-456',
        { sessionId: 'test' }
      );

      const output = getFirstCallArg(mockLogger);
      expect(output).toContain('Pre-Tool Use');
    });

    it('should handle PostToolUse hook data', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        formatted: true,
        hookTypes: ['PostToolUse'],
      });

      await hooks.PostToolUse?.[0].hooks[0](
        { name: 'Read', response: 'File contents' },
        'tool-789',
        { sessionId: 'test' }
      );

      const output = getFirstCallArg(mockLogger);
      expect(output).toContain('Post-Tool Use');
    });

    it('should handle Notification hook data', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        formatted: true,
        hookTypes: ['Notification'],
      });

      await hooks.Notification?.[0].hooks[0](
        { title: 'Build Complete', message: 'Success!' },
        null,
        { sessionId: 'test' }
      );

      const output = getFirstCallArg(mockLogger);
      expect(output).toContain('Notification');
    });

    it('should handle SessionStart hook data', async () => {
      const mockLogger = mock(() => {});
      const hooks = createLoggingHooks({
        logger: mockLogger,
        formatted: true,
        hookTypes: ['SessionStart'],
      });

      await hooks.SessionStart?.[0].hooks[0]({ source: 'startup' }, null, {
        sessionId: 'test',
        transcriptPath: '/path/to/transcript',
      });

      const output = getFirstCallArg(mockLogger);
      expect(output).toContain('Session Started');
    });
  });

  describe('withLogging', () => {
    it('should wrap empty hooks config and add logging', () => {
      const hooks = withLogging({
        PreToolUse: [{ matcher: '.*', hooks: [] }],
      });

      expect(hooks.PreToolUse).toBeDefined();
      expect(hooks.PreToolUse).toHaveLength(1);
      expect(hooks.PreToolUse?.[0].matcher).toBe('.*');
      expect(hooks.PreToolUse?.[0].hooks).toHaveLength(1);
    });

    it('should preserve existing hooks and add logging', async () => {
      const customHook = mock(async () => ({ custom: 'result' }));

      const hooks = withLogging({
        PreToolUse: [
          {
            matcher: 'Read',
            hooks: [customHook],
          },
        ],
      });

      expect(hooks.PreToolUse).toHaveLength(1);
      expect(hooks.PreToolUse?.[0].hooks).toHaveLength(2); // logging hook + custom hook

      // Execute hooks
      const results = [];
      const preToolUseHooks = hooks.PreToolUse?.[0].hooks;
      if (preToolUseHooks) {
        for (const hook of preToolUseHooks) {
          results.push(await hook({ name: 'Read' }, 'tool-123', {}));
        }
      }

      // Custom hook should have been called
      expect(customHook).toHaveBeenCalled();
    });

    it('should add logging to multiple hook types', () => {
      const hooks = withLogging({
        PreToolUse: [{ matcher: '.*', hooks: [] }],
        PostToolUse: [{ matcher: 'Write', hooks: [] }],
        Notification: [{ matcher: '.*', hooks: [] }],
      });

      expect(hooks.PreToolUse).toBeDefined();
      expect(hooks.PostToolUse).toBeDefined();
      expect(hooks.Notification).toBeDefined();
      expect(hooks.SessionStart).toBeUndefined(); // Not in config
    });

    it('should use custom logger when provided', async () => {
      const mockLogger = mock(() => {});

      const hooks = withLogging(
        {
          PreToolUse: [{ matcher: '.*', hooks: [] }],
        },
        {
          logger: mockLogger,
        }
      );

      await hooks.PreToolUse?.[0].hooks[0]({ name: 'Bash' }, 'tool-456', {});

      expect(mockLogger).toHaveBeenCalled();
    });

    it('should format output when formatted is true', async () => {
      const mockLogger = mock(() => {});

      const hooks = withLogging(
        {
          PreToolUse: [{ matcher: '.*', hooks: [] }],
        },
        {
          formatted: true,
          logger: mockLogger,
        }
      );

      await hooks.PreToolUse?.[0].hooks[0]({ name: 'Read' }, 'tool-789', {});

      const output = getFirstCallArg(mockLogger);
      expect(output).toContain('Pre-Tool Use');
    });

    it('should use JSON output when formatted is false', async () => {
      const mockLogger = mock(() => {});

      const hooks = withLogging(
        {
          PreToolUse: [{ matcher: '.*', hooks: [] }],
        },
        {
          formatted: false,
          logger: mockLogger,
        }
      );

      await hooks.PreToolUse?.[0].hooks[0]({ name: 'Read' }, 'tool-999', {});

      expect(mockLogger).toHaveBeenCalled();
      expect(mockLogger.mock.calls.length).toBeGreaterThan(0);
      const output = (mockLogger.mock.calls[0] as unknown as [string])[0];
      expect(output).toBeDefined();
      expect(() => JSON.parse(output as string)).not.toThrow();
    });

    it('should preserve matcher from original config', () => {
      const hooks = withLogging({
        PreToolUse: [
          {
            matcher: 'Read|Write',
            hooks: [],
          },
        ],
      });

      expect(hooks.PreToolUse?.[0].matcher).toBe('Read|Write');
    });

    it('should handle multiple matchers for same hook type', () => {
      const hooks = withLogging({
        PreToolUse: [
          { matcher: 'Read', hooks: [] },
          { matcher: 'Write', hooks: [] },
        ],
      });

      expect(hooks.PreToolUse).toHaveLength(2);
      expect(hooks.PreToolUse?.[0].matcher).toBe('Read');
      expect(hooks.PreToolUse?.[1].matcher).toBe('Write');
    });

    it('should work with real-world example', async () => {
      const mockLogger = mock(() => {});
      const myCustomHook = mock(async (_input) => {
        // Do some custom logic
        return { processed: true };
      });

      const hooks = withLogging(
        {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [myCustomHook],
            },
          ],
          PostToolUse: [{ matcher: '.*', hooks: [] }], // Just logging, no custom hooks
        },
        {
          logger: mockLogger,
        }
      );

      // Simulate PreToolUse hook execution
      const preToolUseHooks = hooks.PreToolUse?.[0].hooks;
      if (preToolUseHooks) {
        for (const hook of preToolUseHooks) {
          await hook({ name: 'Bash', input: { command: 'ls' } }, 'tool-1', {});
        }
      }

      // Logging should have happened
      expect(mockLogger).toHaveBeenCalled();
      // Custom hook should have been called
      expect(myCustomHook).toHaveBeenCalled();
    });

    it('should handle empty hooks array', () => {
      const hooks = withLogging({
        PreToolUse: [
          {
            matcher: 'Read',
            hooks: [],
          },
        ],
      });

      // Should still add logging hook
      expect(hooks.PreToolUse?.[0].hooks).toHaveLength(1);
    });
  });
});
