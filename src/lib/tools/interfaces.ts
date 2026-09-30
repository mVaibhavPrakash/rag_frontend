export type ToolCall = {
  name: string;
  args?: Record<string, unknown>;
};

export type ToolResult = {
  name: string;
  output: Record<string, unknown> | string;
};

export interface ToolExecutor {
  run(call: ToolCall, signal?: AbortSignal): Promise<ToolResult>;
}
