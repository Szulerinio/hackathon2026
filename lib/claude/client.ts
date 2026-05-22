import { getClaudeConfig, type ClaudeConfig, ClaudeConfigError } from "./config";
import type {
  AnthropicErrorBody,
  ClaudeMessage,
  MessageRequest,
  MessageResponse,
} from "./types";

export { ClaudeConfigError };

export class ClaudeApiError extends Error {
  readonly status: number;
  readonly body: AnthropicErrorBody | string;

  constructor(status: number, body: AnthropicErrorBody | string) {
    const message =
      typeof body === "object" && body.error?.message
        ? body.error.message
        : `Anthropic request failed (${status})`;
    super(message);
    this.name = "ClaudeApiError";
    this.status = status;
    this.body = body;
  }
}

export type ClaudeClient = {
  config: ClaudeConfig;
  createMessage: (request: MessageRequest) => Promise<MessageResponse>;
  /** First text block from the assistant reply. */
  completeText: (request: MessageRequest) => Promise<string>;
};

function splitMessages(request: MessageRequest): {
  system?: string;
  messages: ClaudeMessage[];
} {
  const systemParts: string[] = [];
  const messages: ClaudeMessage[] = [];

  for (const msg of request.messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
      continue;
    }
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages,
  };
}

export function textFromMessage(response: MessageResponse): string {
  return response.content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("")
    .trim();
}

export function createClaudeClient(config?: ClaudeConfig): ClaudeClient {
  const resolved = config ?? getClaudeConfig();

  async function createMessage(
    request: MessageRequest,
  ): Promise<MessageResponse> {
    const url = `${resolved.baseUrl.replace(/\/$/, "")}/messages`;
    const { system, messages } = splitMessages(request);

    if (messages.length === 0) {
      throw new ClaudeApiError(400, {
        error: { message: "At least one user or assistant message is required." },
      });
    }

    const body: Record<string, unknown> = {
      model: request.model ?? resolved.defaultModel,
      max_tokens: request.max_tokens ?? 1024,
      messages,
    };
    if (system) body.system = system;
    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": resolved.apiKey,
        "anthropic-version": resolved.apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: MessageResponse | AnthropicErrorBody;
    try {
      parsed = JSON.parse(text) as MessageResponse | AnthropicErrorBody;
    } catch {
      throw new ClaudeApiError(response.status, text || "(empty body)");
    }

    if (!response.ok) {
      throw new ClaudeApiError(response.status, parsed);
    }

    return parsed as MessageResponse;
  }

  async function completeText(request: MessageRequest): Promise<string> {
    const result = await createMessage(request);
    return textFromMessage(result);
  }

  return {
    config: resolved,
    createMessage,
    completeText,
  };
}
