import { createAlertTool } from "./create-alert";
import type {
  AnthropicToolDefinition,
  CrmAiTool,
  ToolHandlerResult,
  ToolUseBlock,
} from "./types";

/** All CRM tools exposed to Claude. Pass to the Messages API `tools` array. */
export const CRM_AI_TOOLS: CrmAiTool[] = [createAlertTool];

export const CRM_AI_TOOL_DEFINITIONS: AnthropicToolDefinition[] =
  CRM_AI_TOOLS.map((t) => t.definition);

const toolsByName = new Map(CRM_AI_TOOLS.map((t) => [t.definition.name, t]));

export function getCrmAiTool(name: string): CrmAiTool | undefined {
  return toolsByName.get(name);
}

export async function runCrmAiTool(
  block: Pick<ToolUseBlock, "name" | "input">,
): Promise<ToolHandlerResult> {
  const tool = getCrmAiTool(block.name);
  if (!tool) {
    return {
      content: JSON.stringify({
        ok: false,
        error: `Unknown tool: ${block.name}`,
      }),
      is_error: true,
    };
  }

  try {
    const input = tool.parseInput(block.input);
    return await tool.run(input);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid tool input.";
    return {
      content: JSON.stringify({ ok: false, error: message }),
      is_error: true,
    };
  }
}
