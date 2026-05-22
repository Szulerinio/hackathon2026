export type ClaudeRole = "user" | "assistant";

export type ClaudeMessage = {
  role: ClaudeRole;
  content: string;
};

export type MessageRequest = {
  model?: string;
  /** Merged into Anthropic `system` when role is system. */
  messages: Array<
    | ClaudeMessage
    | { role: "system"; content: string }
    | { role: ClaudeRole; content: string }
  >;
  max_tokens?: number;
  temperature?: number;
};

export type MessageContentBlock = {
  type: string;
  text?: string;
};

export type MessageResponse = {
  id: string;
  type: string;
  role: string;
  model: string;
  content: MessageContentBlock[];
  stop_reason: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
};

export type AnthropicErrorBody = {
  type?: string;
  error?: {
    type?: string;
    message?: string;
  };
};
