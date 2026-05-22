import "dotenv/config";
import { createClaudeClient } from "../lib/claude";

async function main() {
  const client = createClaudeClient();
  const prompt =
    process.argv.slice(2).join(" ") ||
    "Reply with exactly: Claude connection OK";

  console.log(`Model: ${client.config.defaultModel}`);
  console.log(`Prompt: ${prompt}\n`);

  const reply = await client.completeText({
    messages: [{ role: "user", content: prompt }],
    max_tokens: 64,
    temperature: 0,
  });

  console.log("Response:");
  console.log(reply);
  console.log("\nClaude (Anthropic) connection verified.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
