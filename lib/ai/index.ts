export {
  runDealMatchForContact,
  runDealMatchForListing,
  type DealMatchMeta,
} from "./deal-match-meta";
export {
  matchDealsForContact,
  type MatchDealsForContactInput,
  type MatchDealsForContactResult,
} from "./match-deals-for-contact";
export {
  matchDealsForListing,
  type CreatedPotentialDealSummary,
  type MatchDealsForListingInput,
  type MatchDealsForListingResult,
} from "./match-deals-for-listing";
export { formatActivityForAlertExtraction } from "./format-activity-text";
export { getAiLogs, writeAiLog, type AiLogEntry } from "./logging";
export {
  extractAlertsFromText,
  type CreatedAlertSummary,
  type ExtractAlertsFromTextInput,
  type ExtractAlertsFromTextResult,
} from "./extract-alerts-from-text";
export { runClaudeToolLoop, type ToolLoopRequest } from "./claude-tool-loop";
export {
  CREATE_ALERT_INPUT_SCHEMA,
  SUGGESTED_ACTIONS,
} from "./tools/create-alert-schema";
export { CREATE_POTENTIAL_DEAL_INPUT_SCHEMA } from "./tools/create-potential-deal-schema";
export { GET_CLIENT_NOTES_INPUT_SCHEMA } from "./tools/get-client-notes-schema";
export {
  GET_LISTING_DESCRIPTIONS_INPUT_SCHEMA,
  GET_LISTING_DESCRIPTIONS_STATUSES,
} from "./tools/get-listing-descriptions-schema";
export {
  createAlertTool,
  parseCreateAlertToolInput,
  type CreateAlertToolInput,
} from "./tools/create-alert";
export {
  createPotentialDealTool,
  createPotentialDealFromMatch,
  parseCreatePotentialDealToolInput,
  type CreatePotentialDealToolInput,
} from "./tools/create-potential-deal";
export {
  getClientNotesTool,
  fetchClientNotes,
  parseGetClientNotesToolInput,
  type ClientNotesRow,
  type GetClientNotesToolInput,
} from "./tools/get-client-notes";
export {
  getListingDescriptionsTool,
  fetchListingDescriptions,
  parseGetListingDescriptionsToolInput,
  type GetListingDescriptionsToolInput,
  type ListingDescriptionRow,
} from "./tools/get-listing-descriptions";
export {
  CRM_AI_TOOLS,
  CRM_AI_TOOL_DEFINITIONS,
  getCrmAiTool,
  runCrmAiTool,
} from "./tools/registry";
export type {
  AnthropicToolDefinition,
  CrmAiTool,
  ToolHandlerResult,
  ToolUseBlock,
} from "./tools/types";
