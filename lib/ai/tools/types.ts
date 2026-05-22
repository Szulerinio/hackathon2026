/** Anthropic Messages API tool definition (client tool). */
export type AnthropicToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
};

export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type ToolResultContent =
  | string
  | Array<{ type: "text"; text: string }>;

export type ToolHandlerResult = {
  content: ToolResultContent;
  is_error?: boolean;
};

/** Erased tool handle for the registry (parse + run accept unknown). */
export type CrmAiTool = {
  definition: AnthropicToolDefinition;
  parseInput: (raw: unknown) => unknown;
  run: (input: unknown) => Promise<ToolHandlerResult>;
};
