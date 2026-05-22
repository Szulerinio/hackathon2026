"use server";

import { revalidatePath } from "next/cache";
import { extractAlertsFromText } from "../../lib/ai/extract-alerts-from-text";
import { ClaudeConfigError } from "../../lib/claude/config";
import { ClaudeApiError } from "../../lib/claude/client";

export type CreatedAlertItem = {
  alertId: number;
  contactSlug: string;
  contactName: string;
};

export type ExtractAlertsFromTextActionResult =
  | {
      ok: true;
      created: CreatedAlertItem[];
      summary: string;
    }
  | { ok: false; error: string };

function revalidateAfterAlerts(contactSlugs: string[]) {
  revalidatePath("/");
  revalidatePath("/alerts");
  revalidatePath("/ai/logs");
  for (const slug of new Set(contactSlugs)) {
    revalidatePath(`/contacts/${slug}`);
  }
}

/**
 * Analyzes free text with Claude, extracts action points, and creates CRM alerts.
 */
export async function extractAlertsFromTextAction(
  text: string,
  contactSlug?: string,
  source = "server_action",
): Promise<ExtractAlertsFromTextActionResult> {
  const trimmed = text.trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      error: "Enter at least 10 characters to analyze.",
    };
  }

  try {
    const result = await extractAlertsFromText({
      text: trimmed,
      contactSlug: contactSlug?.trim() || undefined,
      source,
    });

    revalidateAfterAlerts(result.created.map((a) => a.contactSlug));

    return {
      ok: true,
      created: result.created,
      summary: result.summary,
    };
  } catch (err) {
    if (err instanceof ClaudeConfigError) {
      return {
        ok: false,
        error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.",
      };
    }
    if (err instanceof ClaudeApiError) {
      console.error("extractAlertsFromText Claude error:", err.message);
      return { ok: false, error: "AI request failed. Try again in a moment." };
    }
    if (err instanceof Error) {
      console.error("extractAlertsFromText:", err.message);
      return { ok: false, error: err.message };
    }
    console.error("extractAlertsFromText:", err);
    return { ok: false, error: "Could not extract alerts. Try again." };
  }
}
