import type { PureTool } from "./pure-tool";
import { UppercaseTool } from "./uppercase-tool";
/**
 * Single authoritative tool registry.
 * No side effects. No dynamic loading.
 */
const TOOL_REGISTRY = new Map<string, PureTool<any, any>>();

function assertPureTool(tool: PureTool<any, any>) {
  const src = tool.run?.toString() ?? "";

  if (
    src.includes("fs.") ||
    src.includes("fetch(") ||
    src.includes("async ")
  ) {
    throw new Error(`Impure tool rejected at registration: ${tool.name}`);
  }
}

export function registerTool<I, O>(tool: PureTool<I, O>): void {
  assertPureTool(tool); 
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

/**
 * Find all tools that provide a given capability.
 * Pure lookup only — no execution.
 */
export function findToolsByCapability(
  capability: string,
): readonly PureTool<any, any>[] {
  return listTools().filter(t => t.capability === capability);
}

registerTool(UppercaseTool);
