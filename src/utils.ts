import pc from 'picocolors';

/**
 * Get terminal width, defaulting to 80 if not available
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Creates a horizontal line of the specified character
 */
export function createLine(char: string, width?: number): string {
  const termWidth = width ?? getTerminalWidth();
  return char.repeat(termWidth);
}

/**
 * Wraps content in a box with header
 */
export function createBox(header: string, content: string): string {
  const termWidth = getTerminalWidth();
  const topLine = createLine('─', termWidth);
  const bottomLine = createLine('─', termWidth);

  return `${pc.dim(topLine)}\n${header}\n${content}\n${pc.dim(bottomLine)}`;
}

/**
 * Formats a tool parameter value in a compact, readable way
 */
export function formatToolParamValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    // Truncate very long strings
    if (value.length > 100) {
      return `"${value.slice(0, 97)}..."`;
    }
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3) {
      return `[${value.map((v) => formatToolParamValue(v)).join(', ')}]`;
    }
    return `[${value
      .slice(0, 3)
      .map((v) => formatToolParamValue(v))
      .join(', ')}, ... +${value.length - 3} more]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    if (entries.length === 1) {
      const [k, v] = entries[0];
      return `{ ${k}: ${formatToolParamValue(v)} }`;
    }
    // For complex objects, show in compact JSON
    const json = JSON.stringify(value);
    if (json.length <= 80) return json;
    return `{ ${entries.length} properties }`;
  }
  return String(value);
}
