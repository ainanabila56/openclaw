// src/agent/trace/trace-printer.ts
import type { ExecutionTrace } from "./execution-trace.js";

export function formatTrace(trace: ExecutionTrace): string {
  const lines: string[] = [];
  lines.push(`trace_version: ${trace.trace_version}`);
  lines.push(`request_id: ${trace.request_id}`);
  lines.push(`channel: ${trace.channel}`);
  lines.push(`session_id: ${trace.session_id}`);
  lines.push(`message_preview: ${JSON.stringify(trace.message_preview)}`);
  lines.push(`steps:`);
  for (const s of trace.steps) {
    const core = [
      `  - ts: ${s.ts}`,
      `    kind: ${s.kind}`,
      s.decision ? `    decision: ${s.decision}` : "",
      s.reason_code ? `    reason_code: ${s.reason_code}` : "",
      s.detail ? `    detail: ${JSON.stringify(s.detail)}` : "",
    ].filter(Boolean);
    lines.push(...core);
  }
  lines.push(`final:`);
  lines.push(`  decision: ${trace.final.decision}`);
  lines.push(`  reason_code: ${trace.final.reason_code}`);
  return lines.join("\n");
}