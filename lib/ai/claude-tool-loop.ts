import { getClaudeConfig } from "../claude/config";
import { ClaudeApiError } from "../claude/client";
import type { AnthropicErrorBody } from "../claude/types";
import type { AnthropicToolDefinition } from "./tools/types";
import { runCrmAiTool } from "./tools/registry";

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    };

export type ClaudeApiMessage = {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
};

export type ToolLoopRequest = {
  system: string;
  messages: ClaudeApiMessage[];
  tools: AnthropicToolDefinition[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  maxIterations?: number;
};

export type ToolLoopResponse = {
  stop_reason: string | null;
  finalText: string;
  iterations: number;
  messages: ClaudeApiMessage[];
};

type ApiMessageResponse = {
  id: string;
  role: string;
  content: ClaudeContentBlock[];
  stop_reason: string | null;
};

async function postMessages(body: Record<string, unknown>): Promise<ApiMessageResponse> {
  const config = getClaudeConfig();
  const url = `${config.baseUrl.replace(/\/$/, "")}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": config.apiVersion,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: ApiMessageResponse | AnthropicErrorBody;
  try {
    parsed = JSON.parse(text) as ApiMessageResponse | AnthropicErrorBody;
  } catch {
    throw new ClaudeApiError(response.status, text || "(empty body)");
  }

  if (!response.ok) {
    throw new ClaudeApiError(
      response.status,
      parsed as AnthropicErrorBody,
    );
  }

  return parsed as ApiMessageResponse;
}

function textFromBlocks(blocks: ClaudeContentBlock[]): string {
  return blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();
}

/**
 * Runs Claude with tools until end_turn or maxIterations.
 * Executes CRM tools and feeds results back automatically.
 */
export async function runClaudeToolLoop(
  request: ToolLoopRequest,
): Promise<ToolLoopResponse> {
  const config = getClaudeConfig();
  const maxIterations = request.maxIterations ?? 8;
  const messages = [...request.messages];
  let iterations = 0;
  let finalText = "";

  while (iterations < maxIterations) {
    iterations++;

    const result = await postMessages({
      model: request.model ?? config.defaultModel,
      max_tokens: request.max_tokens ?? 4096,
      system: request.system,
      messages,
      tools: request.tools,
      tool_choice: { type: "auto" },
      temperature: request.temperature ?? 0,
    });

    finalText = textFromBlocks(result.content);
    const toolUses = result.content.filter(
      (b): b is Extract<ClaudeContentBlock, { type: "tool_use" }> =>
        b.type === "tool_use",
    );

    messages.push({ role: "assistant", content: result.content });

    if (result.stop_reason !== "tool_use" || toolUses.length === 0) {
      return {
        stop_reason: result.stop_reason,
        finalText,
        iterations,
        messages,
      };
    }

    const toolResults: ClaudeContentBlock[] = [];
    for (const toolUse of toolUses) {
      const handlerResult = await runCrmAiTool({
        name: toolUse.name,
        input: toolUse.input,
      });
      const content =
        typeof handlerResult.content === "string"
          ? handlerResult.content
          : JSON.stringify(handlerResult.content);

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content,
        is_error: handlerResult.is_error,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    stop_reason: "max_iterations",
    finalText,
    iterations,
    messages,
  };
}
