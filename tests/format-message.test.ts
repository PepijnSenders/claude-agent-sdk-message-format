import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import { formatMessage } from '../src/index';

describe('formatMessage - General Tests', () => {
  const originalColumns = process.stdout.columns;
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      writable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      writable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
    });
  });

  describe('Unknown Message Types', () => {
    it('should handle unknown message types gracefully', () => {
      const message = {
        uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
        session_id: 'session-123',
        type: 'unknown_type' as any,
        message: {
          content: 'Unknown content',
        },
      } as any;

      const result = formatMessage(message);

      expect(result).toContain('◆ UNKNOWN');
      expect(result).toContain('[Unknown message type: unknown_type]');
    });
  });

  describe('Box Options', () => {
    it('should format without box when showBox is false', () => {
      const message: SDKMessage = {
        uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'No box for this message',
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
        uuid: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
        session_id: 'session-123',
        type: 'user',
        message: {
          role: 'user',
          content: 'Box for this message',
        },
        parent_tool_use_id: null,
      };

      const result = formatMessage(message, true);

      expect(result).toContain('Box for this message');
      expect(result).toContain('─');
      expect(result).toContain('◆ USER');
    });
  });
});
