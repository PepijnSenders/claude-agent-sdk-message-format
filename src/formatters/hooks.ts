import pc from 'picocolors';

/**
 * Formats PreToolUse hook callback messages
 */
function formatPreToolUseHook(message: any): string {
  const lines: string[] = [];
  lines.push(`\n${pc.blue('🔧')} ${pc.bold('Pre-Tool Use:')} ${pc.cyan(message.tool_name)}`);

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  if (message.tool_input) {
    lines.push(`\n${pc.dim('Tool input:')}`);
    const inputStr =
      typeof message.tool_input === 'string'
        ? message.tool_input
        : JSON.stringify(message.tool_input, null, 2);
    lines.push(
      inputStr
        .split('\n')
        .map((l: string) => `  ${pc.gray(l)}`)
        .join('\n')
    );
  }

  return lines.join('\n');
}

/**
 * Formats PostToolUse hook callback messages
 */
function formatPostToolUseHook(message: any): string {
  const lines: string[] = [];
  lines.push(`\n${pc.green('✅')} ${pc.bold('Post-Tool Use:')} ${pc.cyan(message.tool_name)}`);

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  if (message.tool_response !== undefined) {
    lines.push(`\n${pc.dim('Tool response:')}`);
    const responseStr =
      typeof message.tool_response === 'string'
        ? message.tool_response
        : JSON.stringify(message.tool_response, null, 2);

    // Limit response length for readability
    const maxLength = 500;
    const truncatedResponse =
      responseStr.length > maxLength
        ? responseStr.substring(0, maxLength) + pc.dim('... (truncated)')
        : responseStr;

    lines.push(
      truncatedResponse
        .split('\n')
        .map((l: string) => `  ${pc.gray(l)}`)
        .join('\n')
    );
  }

  return lines.join('\n');
}

/**
 * Formats Notification hook callback messages
 */
function formatNotificationHook(message: any): string {
  const lines: string[] = [];
  lines.push(`\n${pc.yellow('🔔')} ${pc.bold('Notification')}`);

  if (message.title) {
    lines.push(`   ${pc.cyan(message.title)}`);
  }

  if (message.message) {
    lines.push(`\n${pc.dim('Message:')}`);
    lines.push(
      message.message
        .split('\n')
        .map((l: string) => `  ${l}`)
        .join('\n')
    );
  }

  if (message.cwd) {
    lines.push(`\n   ${pc.dim('Location:')} ${message.cwd}`);
  }

  return lines.join('\n');
}

/**
 * Formats UserPromptSubmit hook callback messages
 */
function formatUserPromptSubmitHook(message: any): string {
  const lines: string[] = [];
  lines.push(`\n${pc.magenta('📝')} ${pc.bold('User Prompt Submitted')}`);

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  if (message.prompt) {
    lines.push(`\n${pc.dim('Prompt:')}`);
    // Show first 200 characters of prompt to avoid overwhelming output
    const preview =
      message.prompt.length > 200
        ? message.prompt.substring(0, 200) + pc.dim('... (truncated)')
        : message.prompt;

    lines.push(
      preview
        .split('\n')
        .map((l: string) => `  ${l}`)
        .join('\n')
    );
  }

  return lines.join('\n');
}

/**
 * Formats SessionStart hook callback messages
 */
function formatSessionStartHook(message: any): string {
  const lines: string[] = [];
  const sourceIcons = {
    startup: pc.green('🚀'),
    resume: pc.blue('▶️'),
    clear: pc.yellow('🔄'),
    compact: pc.cyan('📦'),
  };

  const icon = sourceIcons[message.source as keyof typeof sourceIcons] || pc.gray('📍');
  lines.push(`\n${icon} ${pc.bold('Session Started')} ${pc.dim(`(${message.source})`)}`);

  if (message.transcript_path) {
    lines.push(`   ${pc.dim('Transcript:')} ${message.transcript_path}`);
  }

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  if (message.permission_mode) {
    lines.push(`   ${pc.dim('Permission mode:')} ${message.permission_mode}`);
  }

  return lines.join('\n');
}

/**
 * Formats SessionEnd hook callback messages
 */
function formatSessionEndHook(message: any): string {
  const lines: string[] = [];
  lines.push(`\n${pc.red('🛑')} ${pc.bold('Session Ended')}`);

  if (message.reason) {
    lines.push(`   ${pc.dim('Reason:')} ${pc.yellow(message.reason)}`);
  }

  if (message.transcript_path) {
    lines.push(`   ${pc.dim('Transcript:')} ${message.transcript_path}`);
  }

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  return lines.join('\n');
}

/**
 * Formats Stop hook callback messages
 */
function formatStopHook(message: any): string {
  const lines: string[] = [];
  const stopIcon = message.stop_hook_active ? pc.yellow('⏸️') : pc.red('🛑');
  lines.push(`\n${stopIcon} ${pc.bold('Stop Hook Triggered')}`);

  if (message.stop_hook_active) {
    lines.push(`   ${pc.yellow('Stop hook is active')}`);
  } else {
    lines.push(`   ${pc.dim('Stop hook is inactive')}`);
  }

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  if (message.transcript_path) {
    lines.push(`   ${pc.dim('Transcript:')} ${message.transcript_path}`);
  }

  return lines.join('\n');
}

/**
 * Formats SubagentStop hook callback messages
 */
function formatSubagentStopHook(message: any): string {
  const lines: string[] = [];
  const stopIcon = message.stop_hook_active ? pc.yellow('⏸️') : pc.red('🛑');
  lines.push(`\n${stopIcon} ${pc.bold('Subagent Stop Hook Triggered')}`);

  if (message.stop_hook_active) {
    lines.push(`   ${pc.yellow('Stop hook is active')}`);
  } else {
    lines.push(`   ${pc.dim('Stop hook is inactive')}`);
  }

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  if (message.transcript_path) {
    lines.push(`   ${pc.dim('Transcript:')} ${message.transcript_path}`);
  }

  return lines.join('\n');
}

/**
 * Formats PreCompact hook callback messages
 */
function formatPreCompactHook(message: any): string {
  const lines: string[] = [];
  const triggerIcons = {
    manual: pc.blue('👆'),
    auto: pc.cyan('🤖'),
  };

  const icon = triggerIcons[message.trigger as keyof typeof triggerIcons] || pc.gray('📦');
  lines.push(`\n${icon} ${pc.bold('Pre-Compaction')} ${pc.dim(`(${message.trigger})`)}`);

  if (message.custom_instructions) {
    lines.push(`\n${pc.dim('Custom instructions:')}`);
    lines.push(
      message.custom_instructions
        .split('\n')
        .map((l: string) => `  ${pc.cyan(l)}`)
        .join('\n')
    );
  } else {
    lines.push(`   ${pc.dim('No custom instructions')}`);
  }

  if (message.transcript_path) {
    lines.push(`\n   ${pc.dim('Transcript:')} ${message.transcript_path}`);
  }

  if (message.cwd) {
    lines.push(`   ${pc.dim('Working directory:')} ${message.cwd}`);
  }

  return lines.join('\n');
}

/**
 * Main hook message formatter that routes to specific formatters
 */
export function formatHookMessage(hookEventName: string, hookData: any): string {
  switch (hookEventName) {
    case 'PreToolUse':
      return formatPreToolUseHook(hookData);
    case 'PostToolUse':
      return formatPostToolUseHook(hookData);
    case 'Notification':
      return formatNotificationHook(hookData);
    case 'UserPromptSubmit':
      return formatUserPromptSubmitHook(hookData);
    case 'SessionStart':
      return formatSessionStartHook(hookData);
    case 'SessionEnd':
      return formatSessionEndHook(hookData);
    case 'Stop':
      return formatStopHook(hookData);
    case 'SubagentStop':
      return formatSubagentStopHook(hookData);
    case 'PreCompact':
      return formatPreCompactHook(hookData);
    default:
      // Throw an error to trigger fallback to original formatting
      throw new Error(`Unknown hook type: ${hookEventName}`);
  }
}
