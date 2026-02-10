Structure:



1 — Explicit Invariants (“Must Never Happen”)

2 — Threat Model

3 — Invariant → Enforcement Mapping

4 — Governance Enforcement Tests (Static + Fail-Closed)

5 — Future-Change Checklist (Governance Gates)

6 — Phase 22 Verification and Freeze





\## 1 — Explicit Invariants (“Must Never Happen”)



The system is correct because of constraints, not behavior.  

Each invariant below describes a state that must never be reachable.



\### Execution Path Invariants



INV-001 — Single Entry Surface  

Agent execution must only be reachable through handleAgentEntry.  

No other module, command, or test may invoke an executor directly.



INV-002 — Fixed Execution Order  

All agent execution must follow this strict order with no deviations:  

routing → policy evaluation → executor selection → executor execution.



INV-003 — No Executor Bypass  

No code path may call executor.execute() outside the execution spine.



INV-004 — Explicit Execution Enablement  

Agent execution must never occur unless  

OPENCLAW\_ENABLE\_AGENT\_EXECUTION === "true".



INV-005 — Intent Required  

If no intent is resolved, execution must be denied.



INV-006 — Policy Is Authority  

If policy does not explicitly allow the intent + executor, execution must be denied.



INV-007 — Capability Declaration Required  

Executors must declare all capabilities explicitly.  

Undeclared capabilities must always be denied.



INV-008 — Fail-Closed Defaults  

Any unknown or missing intent, executor, or capability must result in denial.



---



\### Side-Effect Invariants



INV-009 — No Network Access  

No outbound or inbound network calls may occur during agent execution.



INV-010 — No Filesystem Writes  

Agent execution must never write to disk.



INV-011 — No Implicit Tool Use  

Tools must never execute implicitly or automatically.  

All tool execution must be explicitly gated by policy.



INV-012 — No Memory Writes by Default  

Memory writes must be unreachable unless explicitly enabled by policy  

(currently unused and must remain so).



INV-013 — No Environment Fallbacks  

No environment variable other than  

OPENCLAW\_ENABLE\_AGENT\_EXECUTION  

may enable execution or bypass governance.



---



\### Determinism and Observability Invariants



INV-014 — Deterministic Execution  

Execution results must depend only on input, policy, and code.  

No time, randomness, or hidden state may influence outcomes.



INV-015 — Raw Trace Only  

The execution trace must remain raw and minimal.  

No formatter may alter, infer, or fabricate trace meaning.



INV-016 — Trace Reflects Reality  

Every trace entry must correspond to a real decision point.  

No synthetic or inferred trace steps are allowed.



INV-017 — Intelligence Is Subordinate  

Any model, planner, or intelligence component must be fully subordinate to  

intent → policy → capability governance.



---



\### Governance Invariants



INV-018 — No Gateway Bypass  

Gateway or CLI paths must never bypass local policy enforcement.



INV-019 — Legacy Brain Disabled  

The legacy OpenClaw agent brain must never execute in this fork.



INV-020 — Executor Default Deny  

Adding a new executor must result in denial until policy explicitly allows it.



INV-021 — Capability Default Deny  

Adding a new capability must result in denial until policy explicitly allows it.



---

## 2 — Threat Model



This threat model exists to make governance reviewable and future-safe.

It defines what must be protected, where trust boundaries exist, and what classes of failure the invariants are designed to prevent.



---



\### Assets (What Must Be Protected)



A1 — Policy Authority  

The policy is the sole authority that determines what may execute.



A2 — Execution Spine Integrity  

All execution must flow through the single, frozen execution spine.



A3 — Side-Effect Boundaries  

The system must not perform network, filesystem, or memory side effects unless explicitly governed.



A4 — Trace Integrity  

The execution trace must accurately reflect real decision points.



A5 — Determinism  

Execution must be reproducible and independent of time, randomness, or environment state.



---



\### Trust Boundaries



B1 — CLI Input Boundary  

User-provided input is untrusted and must not cause execution without governance.



B2 — Environment Boundary  

Environment variables are untrusted except for the explicit execution enable flag including shell aliases and wrapper scripts.



B3 — Executor Boundary  

Executors are the highest-risk components and must be fully constrained.



B4 — Tool Boundary  

Tools may evolve and must remain pure and explicitly governed.



B5 — Policy Boundary  

Policy configuration is data, not code, but governs execution authority.



---



\### Attacker Goals



G1 — Execute without explicit enablement  

Attempt to trigger execution without OPENCLAW\_ENABLE\_AGENT\_EXECUTION.



G2 — Bypass policy checks  

Attempt to execute an intent, executor, or capability not explicitly allowed.



G3 — Introduce a hidden execution path  

Add a secondary entry surface or direct executor call.



G4 — Smuggle side effects  

Introduce network, filesystem, or memory writes through dependencies or tools.



G5 — Corrupt trace accuracy  

Cause trace output to omit, fabricate, or misrepresent decisions.



G6 — Execute intelligence prematurely  

Allow models or planners to act before intent and policy approval.



---



\### Threats (Concrete Failure Modes)



T1 — New command path directly invokes an executor.  

T2 — Policy evaluation defaults to allow on unknown intent or capability.  

T3 — Executor imports a dependency that performs implicit network calls.  

T4 — Tool grows side effects while remaining labeled “pure.”  

T5 — Trace formatter diverges from raw trace semantics.  

T6 — Future model plans or executes tools before governance checks.



---



\### Threat Mitigation Principle



All identified threats are mitigated through explicit invariants.

No dynamic or heuristic defenses are relied upon.



Every future change must be evaluated by mapping new behavior to:

\- affected assets

\- crossed trust boundaries

\- violated or preserved invariants



---



\## 3 — Invariant → Enforcement Mapping



This section maps each invariant to its concrete enforcement.

An invariant is not considered real unless it is enforced by code, test, or policy.



---



\### Invariant → Enforcement Mapping



| Invariant ID | What It Prevents | Enforcement Type | Breakage Mode | Re-verify When |

|-------------|-----------------|------------------|---------------|----------------|

| INV-001 | Multiple execution entry points | Code structure | Executor callable elsewhere | Adding commands |

| INV-002 | Reordered execution flow | Code structure | Execution before policy | Refactors |

| INV-003 | Direct executor invocation | Static scan / test | Hidden execution path | Adding executors |

| INV-004 | Execution without explicit enable | Code guard | Silent execution | Env changes |

| INV-005 | Execution without intent | Policy logic | Fail-open intent | Adding intents |

| INV-006 | Policy bypass | Policy logic | Unauthorized execution | Policy edits |

| INV-007 | Undeclared capabilities | Capability check | Capability creep | Adding tools |

| INV-008 | Fail-open defaults | Policy logic | Silent allow | Schema changes |

| INV-009 | Network side effects | Static scan / test | Hidden I/O | Dependency updates |

| INV-010 | Filesystem writes | Static scan / test | Persistence | Tool changes |

| INV-011 | Implicit tool execution | Code structure | Auto-execution | Tool planning |

| INV-012 | Ungoverned memory writes | Code + policy | State leakage | Memory enablement |

| INV-013 | Env-based bypass | Code audit | Hidden enablement | Config changes |

| INV-014 | Non-determinism | Static scan | Heisenbugs | Model changes |

| INV-015 | Trace distortion | Import audit | Misleading audit | Trace updates |

| INV-016 | Synthetic trace | Code discipline | False audit | Trace refactors |

| INV-017 | Intelligence acting early | Architecture rule | Premature action | Adding models |

| INV-018 | Gateway bypass | Code structure | Remote bypass | CLI changes |

| INV-019 | Legacy brain execution | Static scan | Re-enable legacy | Merges |

| INV-020 | Ungoverned executor add | Policy default | Accidental allow | Executor add |

| INV-021 | Ungoverned capability add | Policy default | Capability sprawl | Tool add |





| Invariant ID | Enforcement Location (Exact File)                       | Exact Guard (Concrete Mechanism)                                                             |

| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |

| INV-001  | src/agent/entry/handle-agent-entry.ts                 | Only exported execution entry. No other module exports an agent execution function.          |

| INV-002  | src/agent/entry/handle-agent-entry.ts                 | Hard-coded call order: decideRouting → evaluatePolicy → selectExecutor → executor.execute. |

| INV-003  | src/commands/agent-via-gateway.ts and src/agent/entry/handle-agent-entry.ts  | Executors obtained only via selectExecutor; no direct execute() calls elsewhere.         |

| INV-004  | src/agent/entry/handle-agent-entry.ts and src/cli/agent-exec-policy.ts  | Execution path is unreachable unless the env gate allows entry; CLI helpers alone do not enable execution.            |

| INV-005  | src/routing/tiered-routing.ts                         | Unknown / empty input maps to unknown intent → executable: false.                        |

| INV-006  | src/policy/evaluate-policy.ts                         | policy.rules.find(...); absence → explicit deny.                                         |

| INV-007  | src/agent/exec/capabilities.ts + executor definitions | Executor exposes fixed capabilities\[]; policy compares against this list only.             |

| INV-008  | src/policy/evaluate-policy.ts                         | Any missing rule, executor, or capability → decision: "deny".                              |

| INV-009  | src/tools/\_\_tests\_\_/tool-import-scan.test.ts          | Static scan forbids net, http, fetch, axios, etc.                                    |

| INV-010  | src/tools/\_\_tests\_\_/tool-import-scan.test.ts          | Static scan forbids fs, path, child\_process.                                           |

| INV-011  | src/agent/exec/local-executor.ts                      | Tool invocation only reachable after policy allow + Capability.ToolInvoke.                 |

| INV-012  | src/memory/memory-types.ts + local-executor.ts      | Memory write requires Capability.MemoryWrite + policy allow; otherwise unreachable.        |

| INV-013  | src/cli/agent-exec-policy.ts                          | Single env flag checked; no alternate env keys referenced anywhere.                          |

| INV-014  | src/tools/\_\_tests\_\_/tool-purity.test.ts               | Static enforcement: tools must be sync, pure, no time/random/fs/net.                         |

| INV-015  | src/agent/trace/trace-printer.ts (unused)             | Import exists but never called in runtime path; raw trace returned instead.                  |

| INV-016  | src/agent/exec/trace.ts                               | Trace entries pushed only at real decision points; no synthetic trace generation.            |

| INV-017  | src/model/\* + src/agent/exec/local-executor.ts      | Models only called inside executor after policy + capability gate.                           |

| INV-018  | src/commands/agent-via-gateway.ts                     | Gateway path routes into entry but cannot execute executor directly.                         |

| INV-019  | Repo-wide static condition                              | Legacy OpenClaw brain modules not imported anywhere in src.                                |

| INV-020  | src/policy/execution-policy.ts                        | defaultDecision: "deny"; new executor IDs denied until added.                              |

| INV-021  | src/policy/execution-policy.ts                        | Capabilities must appear in allowCapabilities; new ones denied by default.                 |



---



\### Enforcement Notes



\- Every row must correspond to at least one real guard in code, test, or policy.

\- Static scans are acceptable enforcement where runtime checks are undesirable.

\- Deny-by-default is mandatory for all expandable surfaces.



---



\### Completion Rule



This section is complete when:

\- Every invariant from 22.2 appears exactly once in this table

\- Each invariant lists at least one enforcement mechanism

\- All enforcement locations can be pointed to in the repo



---



\## 4 — Governance Enforcement Tests (Static + Fail-Closed)



This section defines non-negotiable governance tests.

They exist to mechanically enforce invariants without relying on reviewer discipline.



These tests are allowed to be coarse, static, and intentionally strict.



---



\### Forbidden Surface Scans



The following surfaces must never appear in governed execution paths

(entry surface, routing, policy, executor selection, executors, tools).



\#### Network Access

The following imports must be absent:

\- http

\- https

\- net

\- tls

\- undici

\- axios

\- fetch (direct or indirect)



Violation implies a hard governance failure.



\#### Filesystem Writes

The following imports must be absent:

\- fs

\- node:fs

\- write-capable filesystem utilities



Read-only access is also disallowed unless explicitly reviewed.



\#### Process Escape

The following imports must be absent:

\- child\_process

\- worker\_threads

\- dynamic eval or equivalent



---



\### Execution Spine Integrity Tests



The following conditions must be mechanically enforced:



\- handleAgentEntry is the only reachable execution entry surface.

\- No executor is callable outside the selector/spine.

\- No executor executes before policy approval.

\- No execution occurs without OPENCLAW\_ENABLE\_AGENT\_EXECUTION === "true".



Any alternate call path is considered a critical failure.



---



\### Fail-Closed Policy Tests



The system must deny execution when any of the following are unknown or missing:



\- intent

\- executor

\- capability

\- policy rule



Allow-by-default behavior is forbidden.



---



\### Trace Integrity Tests



\- Raw trace must reflect only real decision points.

\- No formatter may alter execution semantics.

\- trace-printer (or equivalent) must not be imported into the runtime path.



Trace is evidence, not presentation.



---



\### Completion Rule



This section is complete when:



\- At least one test or static scan enforces each forbidden surface

\- Fail-closed behavior is proven for unknown intent, executor, and capability

\- Governance tests fail when any invariant is intentionally violated



---



\## 5 — Future-Change Checklist (Governance Gates)



This checklist defines the mandatory re-verification steps for any future change.

A change is invalid unless all applicable gates pass.



---



\### Adding or Modifying Models (SML or Main)



\- Model execution must occur only after intent resolution and policy approval.

\- Model must not have access to tools, memory, filesystem, or network by default.

\- Model configuration and version must be explicitly pinned.

\- Deterministic settings must be enforced.

\- Tests must prove blocked intents cannot invoke the model.

\- Relevant invariants: INV-002, INV-004, INV-006, INV-014, INV-017.



---



\### Adding or Modifying Executors



\- Executor must declare all capabilities explicitly.

\- Executor must be deny-by-default in policy until explicitly allowed.

\- Executor must not import network, filesystem, or process-escape modules.

\- Executor must only be invocable through the execution spine.

\- Tests must fail if executor is called outside selector/spine.

\- Relevant invariants: INV-001, INV-003, INV-007, INV-009, INV-010, INV-020.



---



\### Adding or Modifying Tools



\- Tool must be pure (no network, filesystem, memory, or environment mutation).

\- Tool must declare capabilities explicitly.

\- Tool execution must be gated by policy approval.

\- Tool must not auto-execute or chain implicitly.

\- Static scans must detect forbidden imports.

\- Relevant invariants: INV-007, INV-009, INV-010, INV-011, INV-021.



---



\### Adding or Modifying Memory



\- Memory reads must occur only after policy approval.

\- Memory writes must be explicitly policy-gated and deny-by-default.

\- Size limits and session isolation must be enforced.

\- Every write must be traceable and reviewable.

\- Tests must prove memory writes are blocked by default.

\- Relevant invariants: INV-012, INV-016.



---



\### Adding or Modifying Networking



\- Default stance remains “no outbound network.”

\- Any exception must be capability-gated and policy-approved.

\- Network usage must be explicit and traceable.

\- Static scans must continue to block network imports elsewhere.

\- Tests must prove all other intents/executors remain network-isolated.

\- Relevant invariants: INV-009, INV-021.



---



\### Modifying Trace or Observability



\- Raw trace semantics must not change.

\- No formatter may alter or infer decision meaning.

\- Trace must continue to reflect only real decision points.

\- Tests must fail if formatter enters runtime path.

\- Relevant invariants: INV-015, INV-016.



---



\### Completion Rule



A future change is acceptable only if:

\- All applicable checklist items pass

\- No invariant is violated

\- Governance tests and static scans pass unchanged



---



\## 6 — Phase 22 Verification and Freeze



This section defines the final verification gate for Phase 22.

No further governance work is allowed in this phase after this point.



---



\### Verification Checklist



All items below must be true simultaneously.



\- All invariants (INV-001 → INV-021) are documented.

\- Every invariant is referenced by at least one enforcement mechanism.

\- Threat model is present and complete (assets, boundaries, threats).

\- Invariant → enforcement mapping table is complete.

\- Future-change checklist exists and references invariant IDs.

\- Governance enforcement tests or static scans exist.

\- Governance tests fail when an invariant is intentionally violated.

\- Governance tests pass without modifying runtime behavior.

\- No observable execution behavior differs from Phase 21.



---



\### Freeze Declaration



At completion of Phase 22:



\- Governance is frozen.

\- Execution spine is frozen.

\- Policy semantics are frozen.

\- Side-effect boundaries are frozen.

\- Trace semantics are frozen.



Any future change that violates an invariant requires:

\- a new phase

\- explicit invariant revision

\- full re-verification



---

