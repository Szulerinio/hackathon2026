/**
 * JSON Schema for create_potential_deal — sent to Anthropic with strict: true.
 */
export const CREATE_POTENTIAL_DEAL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    buyerSlug: {
      type: "string",
      description:
        "Exact CRM contact slug for the buyer (kebab-case), not display name.",
      minLength: 2,
    },
    listingId: {
      type: "number",
      description: "Numeric listing id from the catalog (whole number ≥ 1).",
    },
    matchReason: {
      type: "string",
      description:
        "1–2 sentences: what in the buyer's notes/context overlaps with this listing.",
      minLength: 10,
      maxLength: 1000,
    },
  },
  required: ["buyerSlug", "listingId", "matchReason"],
} as const;
