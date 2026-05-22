export type ClaudeConfig = {
  apiKey: string;
  baseUrl: string;
  apiVersion: string;
  defaultModel: string;
};

export class ClaudeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeConfigError";
  }
}

const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_API_VERSION = "2023-06-01";
/** Sonnet — good default for dev; override via ANTHROPIC_MODEL */
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

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
  };
}
