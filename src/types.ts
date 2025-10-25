// Replicated types from @anthropic-ai/sdk for better type safety
export type BetaTextBlock = {
  type: 'text';
  text: string;
};

export type BetaToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type BetaContentBlock = BetaTextBlock | BetaToolUseBlock;

export type BetaThinkingBlock = {
  type: 'text';
  text: string;
};

export type BetaMessageContent = BetaContentBlock[];

export type BetaMessageWithThinking = {
  content: BetaMessageContent;
  thinking?: BetaThinkingBlock[];
  [key: string]: any;
};
