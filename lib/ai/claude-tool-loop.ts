import { getClaudeConfig } from "../claude/config";
import { ClaudeApiError } from "../claude/client";
import type { AnthropicErrorBody } from "../claude/types";
import { writeAiLog } from "./logging";
import type { AnthropicToolDefinition } from "./tools/types";
import { runCrmAiTool } from "./tools/registry";

export type AiLogContext = {
  source?: string;
  contactSlug?: string;
  listingId?: number;
};

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
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
  logContext?: AiLogContext;
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

async function postMessages(
  body: Record<string, unknown>,
): Promise<ApiMessageResponse> {
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
    throw new ClaudeApiError(response.status, parsed as AnthropicErrorBody);
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

  const model = request.model ?? config.defaultModel;
  const logCtx = request.logContext;

  while (iterations < maxIterations) {
    iterations++;
    const turnStart = Date.now();

    let result: ApiMessageResponse;
    try {
      result = await postMessages({
        model,
        max_tokens: request.max_tokens ?? 4096,
        system: request.system,
        messages,
        tools: request.tools,
        tool_choice: { type: "auto" },
        temperature: request.temperature ?? 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Claude request failed";
      await writeAiLog({
        operation: "claude_turn",
        status: "error",
        source: logCtx?.source,
        contactSlug: logCtx?.contactSlug,
        listingId: logCtx?.listingId,
        model,
        summary: `Turn ${iterations} failed`,
        error: message,
        durationMs: Date.now() - turnStart,
        payload: { iteration: iterations },
      });
      throw err;
    }

    finalText = textFromBlocks(result.content);
    const toolUses = result.content.filter(
      (b): b is Extract<ClaudeContentBlock, { type: "tool_use" }> =>
        b.type === "tool_use",
    );

    await writeAiLog({
      operation: "claude_turn",
      status: "success",
      source: logCtx?.source,
      contactSlug: logCtx?.contactSlug,
      listingId: logCtx?.listingId,
      model,
      summary: `Turn ${iterations}: ${result.stop_reason ?? "done"}${toolUses.length ? ` · ${toolUses.length} tool(s)` : ""}`,
      durationMs: Date.now() - turnStart,
      payload: {
        iteration: iterations,
        stop_reason: result.stop_reason,
        tool_calls: toolUses.map((t) => ({ name: t.name, input: t.input })),
        text_preview: finalText.slice(0, 400),
      },
    });

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
      const toolStart = Date.now();
      const handlerResult = await runCrmAiTool({
        name: toolUse.name,
        input: toolUse.input,
      });
      const content =
        typeof handlerResult.content === "string"
          ? handlerResult.content
          : JSON.stringify(handlerResult.content);

      await writeAiLog({
        operation: "tool_call",
        status: handlerResult.is_error ? "error" : "success",
        source: logCtx?.source,
        contactSlug: logCtx?.contactSlug,
        listingId: logCtx?.listingId,
        model,
        summary: `${toolUse.name}${handlerResult.is_error ? " failed" : " ok"}`,
        inputPreview: JSON.stringify(toolUse.input),
        payload: { tool_use_id: toolUse.id, result: content },
        error: handlerResult.is_error ? content : undefined,
        durationMs: Date.now() - toolStart,
      });

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content,
        is_error: handlerResult.is_error,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  await writeAiLog({
    operation: "tool_loop",
    status: "error",
    source: logCtx?.source,
    contactSlug: logCtx?.contactSlug,
    listingId: logCtx?.listingId,
    model,
    summary: `Stopped after ${maxIterations} iterations`,
    payload: { iterations: maxIterations },
  });

  return {
    stop_reason: "max_iterations",
    finalText,
    iterations,
    messages,
  };
}
