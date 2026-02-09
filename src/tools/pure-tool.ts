import type { ZodType } from "zod";

/**
 * Absolutely inert execution context.
 * No side effects. No handles. No power.
 */
export interface PureToolContext {
  readonly request_id: string;
  readonly session_id: string;
  readonly intent: string;
}

/**
 * A PureTool is:
 * - synchronous
 * - deterministic
 * - side-effect free
 */
export interface PureTool<I, O> {
  readonly name: string;
  readonly description?: string;

  readonly schema: {
    readonly input: ZodType<I>;
    readonly output: ZodType<O>;
  };

  run(input: I, ctx: PureToolContext): O;
}