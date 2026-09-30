import type { ToolCall, ToolExecutor, ToolResult } from "@/lib/tools/interfaces";

export class DefaultToolExecutor implements ToolExecutor {
  async run(call: ToolCall, _signal?: AbortSignal): Promise<ToolResult> {
    return {
      name: call.name,
      output: {
        status: "not_configured",
        message: `Tool ${call.name} is not configured yet.`,
        args: call.args ?? {},
      },
    };
  }
}
