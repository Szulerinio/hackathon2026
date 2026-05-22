/**
 * Canonical JSON Schema for create_alert — sent to Anthropic with strict: true.
 * Parser in create-alert.ts must match these rules.
 */
export const CREATE_ALERT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    contactSlug: {
      type: "string",
      description:
        "Exact CRM contact slug (kebab-case URL id), e.g. anna-krajewska — not display name.",
      minLength: 2,
    },
    reason: {
      type: "string",
      description:
        "Why Rafał must act — 1–3 sentences citing concrete facts from the source text.",
      minLength: 10,
      maxLength: 2000,
    },
    severity: {
      type: "string",
      enum: ["urgent", "warning", "watch", "ok"],
      description:
        "urgent = act today; warning = this week; watch = monitor; ok = soft reminder.",
    },
    dueDate: {
      type: "string",
      description: "When Rafał should act. ISO date only: YYYY-MM-DD.",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    },
    suggestedAction: {
      type: "string",
      enum: ["Call", "Follow up", "Prepare", "Send documents", "Review"],
      description: "Short label for the primary action button in the UI.",
    },
    daysSince: {
      type: ["integer", "null"],
      minimum: 0,
      description:
        "Days since the triggering event, or null if not inferable from text.",
    },
  },
  required: [
    "contactSlug",
    "reason",
    "severity",
    "dueDate",
    "suggestedAction",
    "daysSince",
  ],
} as const;

export const SUGGESTED_ACTIONS = [
  "Call",
  "Follow up",
  "Prepare",
  "Send documents",
  "Review",
] as const;

export type SuggestedAction = (typeof SUGGESTED_ACTIONS)[number];
