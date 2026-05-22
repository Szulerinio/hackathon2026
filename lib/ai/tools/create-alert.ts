import {
  createAlert,
  isDecayTier,
  type CreateAlertInput,
} from "../../alerts-mutations";
import type { DecayTier } from "../../decay";
import type { CrmAiTool, ToolHandlerResult } from "./types";

/** Shape the model must produce when calling `create_alert`. */
export type CreateAlertToolInput = CreateAlertInput;

function readString(
  obj: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; maxLength?: number } = {},
): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    if (opts.required) throw new Error(`"${key}" is required.`);
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`"${key}" must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed && opts.required) {
    throw new Error(`"${key}" cannot be empty.`);
  }
  if (opts.maxLength && trimmed.length > opts.maxLength) {
    throw new Error(`"${key}" must be at most ${opts.maxLength} characters.`);
  }
  return trimmed || undefined;
}

function readSeverity(obj: Record<string, unknown>): DecayTier {
  const raw = readString(obj, "severity", { required: true });
  if (!raw || !isDecayTier(raw)) {
    throw new Error(
      '"severity" must be one of: urgent, warning, watch, ok.',
    );
  }
  return raw;
}

function readDaysSince(obj: Record<string, unknown>): number | undefined {
  const value = obj.daysSince;
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error('"daysSince" must be a non-negative number when provided.');
  }
  return Math.max(0, Math.round(value));
}

export function parseCreateAlertToolInput(raw: unknown): CreateAlertToolInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Tool input must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;

  return {
    contactSlug: readString(obj, "contactSlug", { required: true })!,
    reason: readString(obj, "reason", { required: true, maxLength: 2000 })!,
    suggestedAction: readString(obj, "suggestedAction", { maxLength: 80 }),
    severity: readSeverity(obj),
    dueDate: readString(obj, "dueDate") ?? undefined,
    daysSince: readDaysSince(obj),
  };
}

export const createAlertTool: CrmAiTool = {
  definition: {
    name: "create_alert",
    description: `Create a new proactive alert for a CRM contact.

Use when contact notes, last interaction, deals, or listings imply Rafał should act soon (follow-up, call, prepare for meeting, chase paperwork, etc.).

Required fields:
- contactSlug: exact contact slug from CRM (e.g. "anna-krajewska"), not display name
- reason: 1–3 sentences explaining WHY the alert exists — cite concrete facts from notes (deadlines, unpaid invoices, unanswered questions)
- severity: urgency tier — "urgent" (act today), "warning" (this week), "watch" (monitor), "ok" (low priority reminder)
- dueDate: YYYY-MM-DD when Rafał should act — REQUIRED when the text mentions a deadline, meeting, viewing, or "by Friday". Use CRM_TODAY context from the notes. If no date is inferable, omit.

Optional:
- suggestedAction: short button label shown in UI (e.g. "Call", "Follow up", "Prepare"). Defaults to "Follow up" in the feed if omitted.
- daysSince: integer days since the triggering event (e.g. days since last contact or days overdue)

Do not create duplicate alerts for the same issue. One alert = one actionable insight.`,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        contactSlug: {
          type: "string",
          description:
            "Contact slug (URL id), e.g. anna-krajewska. Must match an existing contact in the CRM.",
        },
        reason: {
          type: "string",
          description:
            "Why Rafał needs to pay attention — specific, grounded in contact notes or context.",
        },
        severity: {
          type: "string",
          enum: ["urgent", "warning", "watch", "ok"],
          description:
            "urgent = act today; warning = this week; watch = monitor; ok = soft reminder.",
        },
        dueDate: {
          type: "string",
          description:
            "Date the action should happen, ISO format YYYY-MM-DD (e.g. 2026-05-24). Set when text specifies when to call, follow up, or deliver something.",
        },
        suggestedAction: {
          type: "string",
          description:
            'Short action label for the UI button, e.g. "Call", "Follow up", "Prepare".',
        },
        daysSince: {
          type: "integer",
          minimum: 0,
          description:
            "Optional days since the relevant event (last touch, overdue item, etc.).",
        },
      },
      required: ["contactSlug", "reason", "severity"],
    },
  },
  parseInput: parseCreateAlertToolInput,
  async run(input: unknown): Promise<ToolHandlerResult> {
    try {
      const result = await createAlert(input as CreateAlertToolInput);
      const payload = {
        ok: true,
        alertId: result.id,
        contactSlug: result.contactSlug,
        contactName: result.contactName,
        message: `Alert #${result.id} created for ${result.contactName}.`,
      };
      return { content: JSON.stringify(payload) };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create alert.";
      return {
        content: JSON.stringify({ ok: false, error: message }),
        is_error: true,
      };
    }
  },
};
