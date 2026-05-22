import { getClaudeConfig } from "../claude/config";
import { formatDate, getCrmToday } from "../decay";
import { prisma } from "../prisma";
import { runClaudeToolLoop, type ClaudeApiMessage } from "./claude-tool-loop";
import { writeAiLog } from "./logging";
import { CRM_AI_TOOL_DEFINITIONS } from "./tools/registry";

export type CreatedAlertSummary = {
  alertId: number;
  contactSlug: string;
  contactName: string;
};

export type ExtractAlertsFromTextInput = {
  text: string;
  /** When analyzing one contact's notes, prefer this slug. */
  contactSlug?: string;
  /** e.g. activity_log, manual, script */
  source?: string;
};

export type ExtractAlertsFromTextResult = {
  created: CreatedAlertSummary[];
  summary: string;
  iterations: number;
};

function buildContactDirectory(
  contacts: { slug: string; name: string }[],
): string {
  return contacts.map((c) => `- ${c.slug}: ${c.name}`).join("\n");
}

function buildSystemPrompt(directory: string): string {
  return `You are an assistant for Rafał, a real estate agent using a personal CRM.

Your job: read the user's text (notes, meeting summary, voice transcript, etc.) and extract concrete action points that deserve a proactive alert.

For each distinct action point, call the create_alert tool once.

Rules:
- Only create alerts you can tie to a contact in the directory (use exact contactSlug).
- reason: 1–3 sentences with specific facts from the text (deadlines, amounts, unanswered requests).
- severity: urgent (today), warning (this week), watch (monitor), ok (soft reminder).
- dueDate: YYYY-MM-DD when Rafał should act — set whenever a deadline, appointment, or "by [date]" appears in the text.
- suggestedAction: short UI label — "Call", "Follow up", "Prepare", etc.
- daysSince: include when the text implies how long something has been waiting.
- Do not duplicate the same issue; prefer 1–5 high-quality alerts over many vague ones.
- If nothing is actionable, do not call create_alert; reply briefly that no alerts were needed.

Contact directory:
${directory}

Today's date (CRM): ${formatDate(getCrmToday())}. Use this to resolve relative deadlines ("Friday", "next week", "today").`;
}

function buildUserMessage(
  text: string,
  contact?: { slug: string; name: string },
): string {
  let prefix = "";
  if (contact) {
    prefix = `Primary contact for this text: ${contact.slug} (${contact.name}). Use this slug when the text is about them unless another person is clearly named.\n\n`;
  }
  return `${prefix}Analyze this text and create alerts for actionable items:\n\n${text.trim()}`;
}

function parseCreatedFromMessages(
  messages: ClaudeApiMessage[],
): CreatedAlertSummary[] {
  const created: CreatedAlertSummary[] = [];

  for (const msg of messages) {
    if (!Array.isArray(msg.content)) continue;
    for (const block of msg.content) {
      if (block.type !== "tool_result") continue;
      try {
        const parsed = JSON.parse(block.content) as {
          ok?: boolean;
          alertId?: number;
          contactSlug?: string;
          contactName?: string;
        };
        if (parsed.ok && parsed.alertId && parsed.contactSlug) {
          created.push({
            alertId: parsed.alertId,
            contactSlug: parsed.contactSlug,
            contactName: parsed.contactName ?? parsed.contactSlug,
          });
        }
      } catch {
        /* ignore */
      }
    }
  }

  return created;
}

export async function extractAlertsFromText(
  input: ExtractAlertsFromTextInput,
): Promise<ExtractAlertsFromTextResult> {
  const text = input.text.trim();
  if (text.length < 10) {
    throw new Error("Text is too short to analyze (minimum 10 characters).");
  }

  const contacts = await prisma.contact.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  if (contacts.length === 0) {
    throw new Error("No contacts in CRM. Seed the database first.");
  }

  let primaryContact: { slug: string; name: string } | undefined;
  if (input.contactSlug) {
    primaryContact = contacts.find((c) => c.slug === input.contactSlug);
    if (!primaryContact) {
      throw new Error(`Contact not found: ${input.contactSlug}`);
    }
  }

  const { cheapModel } = getClaudeConfig();
  const source = input.source?.trim() || "extract_alerts";
  const contactSlug = input.contactSlug?.trim();
  const started = Date.now();

  await writeAiLog({
    operation: "extract_alerts",
    status: "info",
    source,
    contactSlug,
    model: cheapModel,
    summary: "Started alert extraction",
    inputPreview: text,
  });

  try {
    const { finalText, iterations, messages } = await runClaudeToolLoop({
      system: buildSystemPrompt(buildContactDirectory(contacts)),
      messages: [{ role: "user", content: buildUserMessage(text, primaryContact) }],
      tools: CRM_AI_TOOL_DEFINITIONS,
      model: cheapModel,
      max_tokens: 2048,
      temperature: 0,
      logContext: { source, contactSlug },
    });

    const created = parseCreatedFromMessages(messages);
    const summary =
      created.length > 0
        ? `Created ${created.length} alert${created.length === 1 ? "" : "s"}.`
        : finalText || "No alerts created.";

    await writeAiLog({
      operation: "extract_alerts",
      status: "success",
      source,
      contactSlug,
      model: cheapModel,
      summary,
      inputPreview: text,
      durationMs: Date.now() - started,
      payload: {
        iterations,
        alerts_created: created,
        final_text_preview: finalText.slice(0, 500),
      },
    });

    return { created, summary, iterations };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extract alerts failed";
    await writeAiLog({
      operation: "extract_alerts",
      status: "error",
      source,
      contactSlug,
      model: cheapModel,
      summary: "Alert extraction failed",
      inputPreview: text,
      error: message,
      durationMs: Date.now() - started,
    });
    throw err;
  }
}
