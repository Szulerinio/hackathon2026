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
export {
  createAlertTool,
  parseCreateAlertToolInput,
  type CreateAlertToolInput,
} from "./tools/create-alert";
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
