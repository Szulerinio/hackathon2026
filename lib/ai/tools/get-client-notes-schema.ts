/**
 * JSON Schema for get_client_notes — sent to Anthropic with strict: true.
 * Empty object returns all CRM contacts with notes/context for matching.
 */
export const GET_CLIENT_NOTES_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {},
  required: [],
} as const;
