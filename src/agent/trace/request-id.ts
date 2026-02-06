// src/agent/trace/request-id.ts
let seq = 0;

export function nextRequestId(prefix = "req"): string {
  seq = (seq + 1) >>> 0;
  const now = Date.now().toString(36);
  const n = seq.toString(36);
  return `${prefix}_${now}_${n}`;
}