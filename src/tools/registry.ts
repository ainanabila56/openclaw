import type { PureTool } from "./pure-tool";

/**
 * Single authoritative tool registry.
 * No side effects. No dynamic loading.
 */
const TOOL_REGISTRY = new Map<string, PureTool<any, any>>();

export function registerTool<I, O>(tool: PureTool<I, O>): void {
  if (TOOL_REGISTRY.has(tool.name)) {
    throw new Error(`Tool already registered: ${tool.name}`);
  }
  TOOL_REGISTRY.set(tool.name, tool);
}

export function getTool(name: string): PureTool<any, any> | undefined {
  return TOOL_REGISTRY.get(name);
}

export function listTools(): readonly PureTool<any, any>[] {
  return Array.from(TOOL_REGISTRY.values());
}