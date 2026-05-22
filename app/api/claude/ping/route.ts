import { createClaudeClient } from "@/lib/claude";
import { NextResponse } from "next/server";

/** Minimal check that Anthropic credentials work (not wired into CRM UI). */
export async function GET() {
  try {
    const client = createClaudeClient();
    const reply = await client.completeText({
      messages: [{ role: "user", content: "Reply with exactly: pong" }],
      max_tokens: 16,
      temperature: 0,
    });

    return NextResponse.json({
      ok: true,
      model: client.config.defaultModel,
      reply,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("ANTHROPIC_API_KEY") ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
