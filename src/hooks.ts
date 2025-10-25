import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { formatMessage } from './index';

/**
 * Hook callback function type
 */
type HookCallback = (
  input: any,
  toolUseID: string | null,
  options: any
) => Promise<Record<string, any>>;

/**
 * Hook matcher configuration
 */
export interface HookMatcher {
  matcher: string;
  hooks: HookCallback[];
}

/**
 * Hook configuration object for all hook types
 */
export interface HooksConfig {
  PostToolUse?: HookMatcher[];
  PreToolUse?: HookMatcher[];
  Notification?: HookMatcher[];
  UserPromptSubmit?: HookMatcher[];
  SessionStart?: HookMatcher[];
  SessionEnd?: HookMatcher[];
  Stop?: HookMatcher[];
  SubagentStop?: HookMatcher[];
  PreCompact?: HookMatcher[];
}

/**
 * Options for creating logging hooks
 */
export interface LoggingHookOptions {
  /**
   * Custom matcher pattern (default: '.*' to match all)
   */
  matcher?: string;

  /**
   * Whether to use formatted output (default: true)
   * If true, uses formatMessage() from this package
   * If false, uses JSON.stringify()
   */
  formatted?: boolean;

  /**
   * Custom logger function (default: console.log)
   */
  logger?: (message: string) => void;

  /**
   * Hook types to create loggers for (default: all hooks)
   */
  hookTypes?: (keyof HooksConfig)[];
}

/**
 * Default hook types (all available hooks)
 */
const DEFAULT_HOOK_TYPES: (keyof HooksConfig)[] = [
  'PostToolUse',
  'PreToolUse',
  'Notification',
  'UserPromptSubmit',
  'SessionStart',
  'SessionEnd',
  'Stop',
  'SubagentStop',
  'PreCompact',
];

/**
 * Creates a logging hook configuration for all specified hooks
 *
 * @param options Configuration options for the logging hooks
 * @returns A HooksConfig object ready to use in Claude Agent SDK
 *
 * @example
 * ```typescript
 * import { createLoggingHooks } from '@anthropic-ai/claude-agent-sdk-message-format/hooks';
 *
 * // Use with formatted output (default)
 * const hooks = createLoggingHooks();
 *
 * // Use with custom options
 * const hooks = createLoggingHooks({
 *   formatted: true,
 *   logger: (msg) => fs.appendFileSync('hooks.log', msg + '\n'),
 *   hookTypes: ['PreToolUse', 'PostToolUse'], // Only log tool-related hooks
 * });
 * ```
 */
export function createLoggingHooks(options: LoggingHookOptions = {}): HooksConfig {
  const {
    matcher = '.*',
    formatted = true,
    logger = console.log,
    hookTypes = DEFAULT_HOOK_TYPES,
  } = options;

  const hooks: HooksConfig = {};

  for (const hookType of hookTypes) {
    hooks[hookType] = [
      {
        matcher,
        hooks: [
          async (input: any, toolUseID: string | null, hookOptions: any) => {
            // Create a synthetic message that matches the SDKMessage format
            const syntheticMessage = createSyntheticHookMessage(
              hookType,
              input,
              toolUseID,
              hookOptions
            );

            if (formatted) {
              // Use the formatted output
              const formattedOutput = formatMessage(syntheticMessage);
              logger(formattedOutput);
            } else {
              // Use raw JSON output
              logger(JSON.stringify({ hookType, input, toolUseID, options: hookOptions }, null, 2));
            }

            return {};
          },
        ],
      },
    ];
  }

  return hooks;
}

/**
 * Creates a synthetic SDKMessage for a hook callback
 * This allows us to use the formatMessage function with hook data
 */
function createSyntheticHookMessage(
  hookType: keyof HooksConfig,
  input: any,
  _toolUseID: string | null,
  hookOptions: any
): SDKMessage {
  // Generate a synthetic message that will be formatted by our hook formatters
  const baseMessage: any = {
    uuid: '00000000-0000-0000-0000-000000000000' as const,
    session_id: hookOptions.sessionId || 'unknown',
    type: 'system' as const,
    subtype: 'hook_response' as const,
    hook_name: hookType,
    hook_event: hookType,
  };

  // Add hook-specific data based on hook type
  switch (hookType) {
    case 'PreToolUse':
      baseMessage.tool_name = input?.name || 'unknown';
      baseMessage.tool_input = input?.input || input;
      break;

    case 'PostToolUse':
      baseMessage.tool_name = input?.name || 'unknown';
      baseMessage.tool_input = input?.input;
      baseMessage.tool_response = input?.response || input;
      break;

    case 'Notification':
      baseMessage.title = input?.title;
      baseMessage.message = input?.message || input;
      break;

    case 'UserPromptSubmit':
      baseMessage.prompt = input?.prompt || input;
      break;

    case 'SessionStart':
      baseMessage.source = input?.source || 'unknown';
      baseMessage.transcript_path = input?.transcriptPath || hookOptions.transcriptPath;
      baseMessage.permission_mode = input?.permissionMode || hookOptions.permissionMode;
      break;

    case 'SessionEnd':
      baseMessage.reason = input?.reason || 'unknown';
      baseMessage.transcript_path = input?.transcriptPath || hookOptions.transcriptPath;
      break;

    case 'Stop':
    case 'SubagentStop':
      baseMessage.stop_hook_active = input?.stopHookActive ?? true;
      baseMessage.transcript_path = input?.transcriptPath || hookOptions.transcriptPath;
      break;

    case 'PreCompact':
      baseMessage.trigger = input?.trigger || 'manual';
      baseMessage.custom_instructions = input?.customInstructions || null;
      baseMessage.transcript_path = input?.transcriptPath || hookOptions.transcriptPath;
      break;
  }

  // Add common fields
  baseMessage.cwd = hookOptions.cwd || process.cwd();
  baseMessage.exit_code = 0;

  return baseMessage as SDKMessage;
}

/**
 * Creates a single logging hook for a specific hook type
 * Useful when you only want to log one type of hook
 *
 * @param hookType The type of hook to create
 * @param options Configuration options for the logging hook
 * @returns A HooksConfig object with only the specified hook type
 *
 * @example
 * ```typescript
 * import { createSingleLoggingHook } from '@anthropic-ai/claude-agent-sdk-message-format/hooks';
 *
 * const hooks = {
 *   ...createSingleLoggingHook('PreToolUse'),
 *   ...createSingleLoggingHook('PostToolUse', { logger: myCustomLogger }),
 * };
 * ```
 */
export function createSingleLoggingHook(
  hookType: keyof HooksConfig,
  options: Omit<LoggingHookOptions, 'hookTypes'> = {}
): HooksConfig {
  return createLoggingHooks({ ...options, hookTypes: [hookType] });
}

/**
 * Options for withLogging wrapper
 */
export interface WithLoggingOptions {
  /**
   * Whether to use formatted output (default: true)
   * If true, uses formatMessage() from this package
   * If false, uses JSON.stringify()
   */
  formatted?: boolean;

  /**
   * Custom logger function (default: console.log)
   */
  logger?: (message: string) => void;
}

/**
 * Wraps an existing hooks configuration and adds formatted logging to all hooks.
 * This is an invisible wrapper that preserves your original hook configuration
 * while adding beautiful formatted output for debugging and monitoring.
 *
 * @param hooksConfig Your existing hooks configuration
 * @param options Configuration options for the logging behavior
 * @returns Enhanced hooks configuration with logging added
 *
 * @example
 * ```typescript
 * import { withLogging } from 'claude-pretty-printer/hooks';
 * import { query } from '@anthropic-ai/claude-agent-sdk';
 *
 * // Simple usage - adds logging to existing hooks
 * const hooks = withLogging({
 *   PreToolUse: [
 *     {
 *       matcher: '.*',
 *       hooks: [
 *         async (input, toolUseID, options) => {
 *           // Your custom logic here
 *           return {};
 *         },
 *       ],
 *     },
 *   ],
 * });
 *
 * // With custom options
 * const hooks = withLogging(
 *   {
 *     PreToolUse: [{ matcher: '.*', hooks: [myHook] }],
 *     PostToolUse: [{ matcher: 'Read|Write', hooks: [anotherHook] }],
 *   },
 *   {
 *     formatted: true,
 *     logger: (msg) => fs.appendFileSync('hooks.log', msg + '\n'),
 *   }
 * );
 *
 * // Even works with empty hooks - just adds logging
 * const hooks = withLogging({
 *   PreToolUse: [{}], // No custom hooks, just logging
 * });
 * ```
 */
export function withLogging(
  hooksConfig: Partial<HooksConfig>,
  options: WithLoggingOptions = {}
): HooksConfig {
  const { formatted = true, logger = console.log } = options;

  const enhancedConfig: HooksConfig = {};

  // Iterate through all hook types in the provided config
  for (const hookType of Object.keys(hooksConfig) as (keyof HooksConfig)[]) {
    const hookMatchers = hooksConfig[hookType];
    if (!hookMatchers) continue;

    enhancedConfig[hookType] = hookMatchers.map((matcher) => {
      // Create the logging hook
      const loggingHook: HookCallback = async (input, toolUseID, hookOptions) => {
        // Create a synthetic message for formatting
        const syntheticMessage = createSyntheticHookMessage(
          hookType,
          input,
          toolUseID,
          hookOptions
        );

        if (formatted) {
          const formattedOutput = formatMessage(syntheticMessage);
          logger(formattedOutput);
        } else {
          logger(JSON.stringify({ hookType, input, toolUseID, options: hookOptions }, null, 2));
        }

        return {};
      };

      // Combine logging hook with existing hooks
      const existingHooks = matcher.hooks || [];
      const combinedHooks = [loggingHook, ...existingHooks];

      return {
        matcher: matcher.matcher || '.*',
        hooks: combinedHooks,
      };
    });
  }

  return enhancedConfig;
}
