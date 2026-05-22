export type ClaudeConfig = {
  apiKey: string;
  baseUrl: string;
  apiVersion: string;
  defaultModel: string;
  /** Haiku — tool loops, alert extraction, bulk tasks */
  cheapModel: string;
};

export class ClaudeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeConfigError";
  }
}

const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_API_VERSION = "2023-06-01";
/** Sonnet — chat / quality tasks; override via ANTHROPIC_MODEL */
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
/** Haiku — cheap tool use; override via ANTHROPIC_CHEAP_MODEL */
const DEFAULT_CHEAP_MODEL = "claude-haiku-4-5-20251001";

export function hasClaudeApiKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ANTHROPIC_API_KEY?.trim());
}

export function getClaudeConfig(
  env: NodeJS.ProcessEnv = process.env,
): ClaudeConfig {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new ClaudeConfigError(
      "ANTHROPIC_API_KEY is missing. Create a key at https://console.anthropic.com/ and add it to .env.",
    );
  }

  return {
    apiKey,
    baseUrl: env.ANTHROPIC_BASE_URL?.trim() || DEFAULT_BASE_URL,
    apiVersion: env.ANTHROPIC_API_VERSION?.trim() || DEFAULT_API_VERSION,
    defaultModel: env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    cheapModel: env.ANTHROPIC_CHEAP_MODEL?.trim() || DEFAULT_CHEAP_MODEL,
  };
}
