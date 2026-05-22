/** Listing statuses accepted by get_listing_descriptions (default: active only). */
export const GET_LISTING_DESCRIPTIONS_STATUSES = [
  "active",
  "sold",
  "withdrawn",
] as const;

export type GetListingDescriptionsStatus =
  (typeof GET_LISTING_DESCRIPTIONS_STATUSES)[number];

/**
 * JSON Schema for get_listing_descriptions — sent to Anthropic with strict: true.
 * Empty object uses default filter (active listings only).
 */
export const GET_LISTING_DESCRIPTIONS_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      description:
        'Optional listing status filter. Omit for "active" only (default).',
      enum: [...GET_LISTING_DESCRIPTIONS_STATUSES],
    },
  },
  required: [],
} as const;
