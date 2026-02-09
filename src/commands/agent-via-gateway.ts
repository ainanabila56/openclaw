import { isAgentExecutionDisabled } from "../cli/agent-exec-policy.js";
import { decideRouting } from "../routing/tiered-routing.js";
import { ExecutionState } from "../agent/exec/state.js";
import { Capability } from "../agent/exec/capabilities.js";
import { getExecutionPolicy } from "../policy/execution-policy.js";
import { executionTrace } from "../agent/exec/trace.js";
import { selectExecutor } from "../agent/exec/select-executor.js";
import { TraceBuilder, formatTrace, nextRequestId } from "../agent/trace/index.js";
import { evaluatePolicy } from "../policy/evaluate-policy";
import type { CliDeps } from "../cli/deps.js";
import type { RuntimeEnv } from "../runtime.js";
import { listAgentIds } from "../agents/agent-scope.js";
import { DEFAULT_CHAT_CHANNEL } from "../channels/registry.js";
import { formatCliCommand } from "../cli/command-format.js";
import { withProgress } from "../cli/progress.js";
import { loadConfig } from "../config/config.js";
import { callGateway, randomIdempotencyKey } from "../gateway/call.js";
import { normalizeAgentId } from "../routing/session-key.js";
import {
  GATEWAY_CLIENT_MODES,
  GATEWAY_CLIENT_NAMES,
  normalizeMessageChannel,
} from "../utils/message-channel.js";
import { agentCommand } from "./agent.js";
import { resolveSessionKeyForRequest } from "./agent/session.js";

type AgentGatewayResult = {
  payloads?: Array<{
    text?: string;
    mediaUrl?: string | null;
    mediaUrls?: string[];
  }>;
  meta?: unknown;
};

type GatewayAgentResponse = {
  runId?: string;
  status?: string;
  summary?: string;
  result?: AgentGatewayResult;
};

export type AgentCliOpts = {
  message: string;
  agent?: string;
  to?: string;
  sessionId?: string;
  thinking?: string;
  verbose?: string;
  json?: boolean;
  timeout?: string;
  deliver?: boolean;
  channel?: string;
  replyTo?: string;
  replyChannel?: string;
  replyAccount?: string;
  bestEffortDeliver?: boolean;
  lane?: string;
  runId?: string;
  extraSystemPrompt?: string;
  local?: boolean;
};

function parseTimeoutSeconds(opts: { cfg: ReturnType<typeof loadConfig>; timeout?: string }) {
  const raw =
    opts.timeout !== undefined
      ? Number.parseInt(String(opts.timeout), 10)
      : (opts.cfg.agents?.defaults?.timeoutSeconds ?? 600);
  if (Number.isNaN(raw) || raw <= 0) {
    throw new Error("--timeout must be a positive integer (seconds)");
  }
  return raw;
}

function formatPayloadForLog(payload: {
  text?: string;
  mediaUrls?: string[];
  mediaUrl?: string | null;
}) {
  const lines: string[] = [];
  if (payload.text) {
    lines.push(payload.text.trimEnd());
  }
  const mediaUrl =
    typeof payload.mediaUrl === "string" && payload.mediaUrl.trim()
      ? payload.mediaUrl.trim()
      : undefined;
  const media = payload.mediaUrls ?? (mediaUrl ? [mediaUrl] : []);
  for (const url of media) {
    lines.push(`MEDIA:${url}`);
  }
  return lines.join("\n").trimEnd();
}

export async function agentViaGatewayCommand(opts: AgentCliOpts, runtime: RuntimeEnv) {
  const body = (opts.message ?? "").trim();
  if (!body) {
    throw new Error("Message (--message) is required");
  }
  if (!opts.to && !opts.sessionId && !opts.agent) {
    throw new Error("Pass --to <E.164>, --session-id, or --agent to choose a session");
  }

  const cfg = loadConfig();
  const agentIdRaw = opts.agent?.trim();
  const agentId = agentIdRaw ? normalizeAgentId(agentIdRaw) : undefined;
  if (agentId) {
    const knownAgents = listAgentIds(cfg);
    if (!knownAgents.includes(agentId)) {
      throw new Error(
        `Unknown agent id "${agentIdRaw}". Use "${formatCliCommand("openclaw agents list")}" to see configured agents.`,
      );
    }
  }
  const timeoutSeconds = parseTimeoutSeconds({ cfg, timeout: opts.timeout });
  const gatewayTimeoutMs = Math.max(10_000, (timeoutSeconds + 30) * 1000);

  const sessionKey = resolveSessionKeyForRequest({
    cfg,
    agentId,
    to: opts.to,
    sessionId: opts.sessionId,
  }).sessionKey;

  const channel = normalizeMessageChannel(opts.channel) ?? DEFAULT_CHAT_CHANNEL;
  const idempotencyKey = opts.runId?.trim() || randomIdempotencyKey();

  const response = await withProgress(
    {
      label: "Waiting for agent reply…",
      indeterminate: true,
      enabled: opts.json !== true,
    },
    async () =>
      await callGateway<GatewayAgentResponse>({
        method: "agent",
        params: {
          message: body,
          agentId,
          to: opts.to,
          replyTo: opts.replyTo,
          sessionId: opts.sessionId,
          sessionKey,
          thinking: opts.thinking,
          deliver: Boolean(opts.deliver),
          channel,
          replyChannel: opts.replyChannel,
          replyAccountId: opts.replyAccount,
          timeout: timeoutSeconds,
          lane: opts.lane,
          extraSystemPrompt: opts.extraSystemPrompt,
          idempotencyKey,
        },
        expectFinal: true,
        timeoutMs: gatewayTimeoutMs,
        clientName: GATEWAY_CLIENT_NAMES.CLI,
        mode: GATEWAY_CLIENT_MODES.CLI,
      }),
  );

  if (opts.json) {
    runtime.log(JSON.stringify(response, null, 2));
    return response;
  }

  const result = response?.result;
  const payloads = result?.payloads ?? [];

  if (payloads.length === 0) {
    runtime.log(response?.summary ? String(response.summary) : "No reply from agent.");
    return response;
  }

  for (const payload of payloads) {
    const out = formatPayloadForLog(payload);
    if (out) {
      runtime.log(out);
    }
  }

  return response;
}

export async function agentCliCommand(opts, runtime, deps) {
  const trace = new TraceBuilder({
    request_id: nextRequestId("agent"),
    channel: "cli",
    session_id: opts.sessionId ?? "cli",
    message: opts.message,
  });

  trace.add({ kind: "entry" });

  // ENV GATE
  if (isAgentExecutionDisabled()) {
    trace.add({
      kind: "env_gate",
      decision: "deny",
      reason_code: "execution_disabled",
    });

    trace.finalize({
      decision: "deny",
      reason_code: "execution_disabled",
    });

    runtime.log?.(
      "Agent execution is disabled (Phase 1 hardening). No gateway calls, embedded agents, models, tools, or memory were invoked.",
    );

    if (opts.trace) runtime.log?.(JSON.stringify(trace, null, 2));
    return;
  }

  // ROUTING
  const decision = decideRouting(opts.message);
  const intent = (decision as any).label ?? (decision as any).intent;

  trace.add({
    kind: "tier_route",
    decision: "allow",
    detail: { tier: decision.tier, intent },
  });

  runtime.log?.(
    `Execution state: Routed, tier: ${decision.tier}`,
  );

  // EXECUTABLE PATH
  if (decision.tier === "local-intent" && decision.executable) {
    const executor = selectExecutor(intent);

    const evalResult = evaluatePolicy(getExecutionPolicy(), {
      intent,
      executorId: executor.id,
      requestedCapabilities: executor.capabilities,
    });

    trace.add({
      kind: "policy_gate",
      decision: evalResult.decision,
      reason_code: evalResult.reason_code === "ok" ? "ok" : "policy_rule_deny",
      detail: evalResult.detail ?? { intent, executorId: executor.id },
    });

    if (evalResult.decision === "deny") {
      trace.finalize({
        decision: "deny",
        reason_code: "policy_rule_deny",
      });

      runtime.error?.("Executor denied by execution policy");
      if (opts.trace) runtime.log?.(JSON.stringify(trace, null, 2));
      return;
    }

    // EXECUTOR SELECT
    trace.add({
      kind: "executor_select",
      decision: "allow",
      detail: {
        executor: executor.id,
        capabilities: executor.capabilities,
      },
    });

    // EXECUTOR RUN
    const result = await executor.execute({
      message: opts.message,
      agentId: opts.agent,
      sessionId: opts.sessionId,
      policyDecision: decision,
    });

    trace.add({
      kind: "executor_run",
      decision: "allow",
    });

    if (result.meta?.memory_write === true) {
      trace.add({
        kind: "memory_write",
        decision: "allow",
      });
    }

    result.payloads?.forEach((p) => {
      if (p.text) runtime.log?.(p.text);
    });

    trace.finalize({
      decision: "allow",
      reason_code: "ok",
    });

    if (opts.trace) runtime.log?.(JSON.stringify(trace, null, 2));
    return;
  }

  // NON-EXECUTABLE FALLBACK
  trace.add({
    kind: "executor_select",
    decision: "deny",
    reason_code: "no_executor",
    detail: { tier: decision.tier, intent },
  });

  trace.finalize({
    decision: "deny",
    reason_code: "no_executor",
  });

  if (opts.trace) runtime.log?.(JSON.stringify(trace, null, 2));
  return;
}