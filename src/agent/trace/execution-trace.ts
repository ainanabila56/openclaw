// src/agent/trace/execution-trace.ts

export type TraceStepKind =
  | "entry"
  | "env_gate"
  | "intent_infer"
  | "tier_route"
  | "policy_gate"
  | "capability_gate"
  | "executor_select"
  | "executor_run"
  | "exit";

export type TraceDecision = "allow" | "deny" | "skip";

export type TraceReasonCode =
  | "execution_disabled"
  | "env_override_missing"
  | "policy_default_deny"
  | "policy_rule_deny"
  | "capability_missing"
  | "no_executor"
  | "ok";

export interface TraceStep {
  readonly ts: string; // ISO8601
  readonly kind: TraceStepKind;
  readonly decision?: TraceDecision;
  readonly reason_code?: TraceReasonCode;
  readonly detail?: Record<string, unknown>;
}

export interface ExecutionTrace {
  readonly trace_version: 1;
  readonly request_id: string;
  readonly channel: string;
  readonly session_id: string;
  readonly message_preview: string; // bounded, no full raw message
  readonly steps: readonly TraceStep[];
  readonly final: {
    readonly decision: TraceDecision;
    readonly reason_code: TraceReasonCode;
  };
}

function isoNow(): string {
  return new Date().toISOString();
}

function freezeDeep<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const v of Object.values(obj as any)) {
      freezeDeep(v);
    }
  }
  return obj;
}

export class TraceBuilder {
  private readonly request_id: string;
  private readonly channel: string;
  private readonly session_id: string;
  private readonly message_preview: string;
  private steps: TraceStep[] = [];
  private finalized: ExecutionTrace | null = null;

  constructor(args: {
    request_id: string;
    channel: string;
    session_id: string;
    message: string;
    preview_limit?: number;
  }) {
    const limit = args.preview_limit ?? 160;
    this.request_id = args.request_id;
    this.channel = args.channel;
    this.session_id = args.session_id;
    this.message_preview = (args.message ?? "").slice(0, limit);
  }

  add(step: Omit<TraceStep, "ts">): void {
    if (this.finalized) throw new Error("TraceBuilder is finalized");
    this.steps.push({ ts: isoNow(), ...step });
  }

  finalize(final: ExecutionTrace["final"]): ExecutionTrace {
    if (this.finalized) return this.finalized;
    const out: ExecutionTrace = {
      trace_version: 1,
      request_id: this.request_id,
      channel: this.channel,
      session_id: this.session_id,
      message_preview: this.message_preview,
      steps: this.steps.slice(),
      final,
    };
    this.finalized = freezeDeep(out);
    return this.finalized;
  }
}