import {
  createAlert,
  isDecayTier,
  parseDueDate,
  type CreateAlertInput,
} from "../../alerts-mutations";
import type { DecayTier } from "../../decay";
import {
  CREATE_ALERT_INPUT_SCHEMA,
  SUGGESTED_ACTIONS,
  type SuggestedAction,
} from "./create-alert-schema";
import type { CrmAiTool, ToolHandlerResult } from "./types";

/** Shape the model must produce when calling `create_alert`. */
export type CreateAlertToolInput = CreateAlertInput & {
  suggestedAction: SuggestedAction;
  dueDate: string;
};

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

function readDueDate(obj: Record<string, unknown>): string {
  const raw = readString(obj, "dueDate", { required: true });
  const parsed = parseDueDate(raw);
  if (!parsed) {
    throw new Error(
      '"dueDate" must be a valid ISO date YYYY-MM-DD (e.g. 2026-05-24).',
    );
  }
  return parsed;
}

function readSuggestedAction(obj: Record<string, unknown>): SuggestedAction {
  const raw = readString(obj, "suggestedAction", { required: true });
  if (!raw || !(SUGGESTED_ACTIONS as readonly string[]).includes(raw)) {
    throw new Error(
      `"suggestedAction" must be one of: ${SUGGESTED_ACTIONS.join(", ")}.`,
    );
  }
  return raw as SuggestedAction;
}

function readDaysSince(obj: Record<string, unknown>): number | undefined {
  const value = obj.daysSince;
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error('"daysSince" must be an integer or null.');
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
    severity: readSeverity(obj),
    dueDate: readDueDate(obj),
    suggestedAction: readSuggestedAction(obj),
    daysSince: readDaysSince(obj),
  };
}

export const createAlertTool: CrmAiTool = {
  definition: {
    name: "create_alert",
    strict: true,
    description: `Create one CRM alert. Call once per distinct action point.

All fields are required and must match the schema exactly.
- dueDate: always YYYY-MM-DD — use the deadline from text, or CRM today for "act now" / urgent items.
- suggestedAction: pick the closest enum value for the primary next step.
- daysSince: integer days waiting, or null if unknown.`,
    input_schema: {
      ...CREATE_ALERT_INPUT_SCHEMA,
      required: [...CREATE_ALERT_INPUT_SCHEMA.required],
    },
  },
  parseInput: parseCreateAlertToolInput,
  async run(input: unknown): Promise<ToolHandlerResult> {
    try {
      const parsed = parseCreateAlertToolInput(input);
      const result = await createAlert(parsed);
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
