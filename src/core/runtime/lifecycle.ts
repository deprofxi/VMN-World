/**
 * PR-16: process-level failure hooks and a bounded graceful shutdown.
 *
 * Evidence recorded in `docs/audit/production-readiness-deepcheck-2026-10-16.md`:
 * the only signal wiring in the product was `SIGTERM`/`SIGINT` calling
 * `app.stop()` and then `process.exit(0)`, with nothing listening for
 * `unhandledRejection` or `uncaughtException`, and no deadline on the stop
 * itself. `Server.close()` waits for open connections to finish, so a single
 * keep-alive client could hold the process past the orchestrator's grace period
 * and be SIGKILLed — an abrupt death that reports nothing and drains nothing,
 * including the durable write-behind journal (TSK-17).
 *
 * The failure path is deliberately fail-visible rather than fail-quiet: a
 * rejected promise nobody awaited or an exception that escaped its handler is
 * reported at ERROR and still terminates the process with a non-zero code,
 * because a process that has thrown an unhandled error is not in a state a
 * supervisor should keep serving traffic from. What changes is that it happens
 * *after* attempting the same bounded stop, instead of by SIGKILL.
 *
 * Canonical law 20 (evidence before claims) and `<definition_of_done>`
 * (rollback/recovery considered) — a shutdown that cannot be observed from
 * outside the process is not a shutdown an operator can rely on.
 */

import type { EventEmitter } from "node:events";

/**
 * Default stop deadline: the orchestrator's grace period is the real ceiling,
 * and Docker's default `stop_grace_period` is 10s — after which the container is
 * SIGKILLed. Finishing inside 8s leaves room for the exit to be logged and for
 * the platform to record why the process ended. Override per deployment with
 * `VMNL_SHUTDOWN_DEADLINE_MS` (validated by the config schema).
 */
export const DEFAULT_SHUTDOWN_DEADLINE_MS = 8000;

export type LifecycleLogLevel = "INFO" | "WARN" | "ERROR";

export type LifecycleLogger = (level: LifecycleLogLevel, message: string, meta?: Record<string, unknown>) => void;

/** The subset of `process` this module needs; a test can pass an EventEmitter. */
export type LifecycleEventTarget = Pick<EventEmitter, "on">;

export interface ShutdownOutcome {
  outcome: "stopped" | "timed_out" | "failed";
  error?: unknown;
}

export interface LifecycleGuardOptions {
  /** Signal/failure emitter. `process` in production. */
  target: LifecycleEventTarget;
  /** Releases listeners, timers and queued work. Invoked at most once. */
  stop: () => Promise<void>;
  /** Terminates the process. Injected so a test can observe the exit code. */
  exit: (code: number) => void;
  /** How long `stop()` may take before the process gives up on it. */
  deadlineMs?: number;
  log?: LifecycleLogger;
}

export interface LifecycleGuardHandle {
  /** Runs the bounded stop once. Exposed so a boot failure can use it too. */
  shutdown: (trigger: string, exitCode: number) => Promise<void>;
  /** True once a stop has been requested (a signal or a fatal failure). */
  started: () => boolean;
  /** True once the stop has settled, whether it succeeded, failed or expired. */
  finished: () => boolean;
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    const serialized = JSON.stringify(error);
    return serialized === undefined ? String(error) : serialized;
  } catch {
    return String(error);
  }
}

/**
 * Races a stop against a deadline so a stop that never settles cannot hold the
 * process open. The deadline timer is unref'd, so a stop that wins the race
 * lets Node exit without waiting for the timer to be collected.
 */
export async function stopWithinDeadline(stop: () => Promise<void>, deadlineMs: number): Promise<ShutdownOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<ShutdownOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ outcome: "timed_out" }), deadlineMs);
    (timer as { unref?: () => void }).unref?.();
  });

  const stopping = Promise.resolve()
    .then(() => stop())
    .then<ShutdownOutcome, ShutdownOutcome>(
      () => ({ outcome: "stopped" }),
      (error: unknown) => ({ outcome: "failed", error })
    );

  const result = await Promise.race([stopping, expiry]);
  if (timer) clearTimeout(timer);
  return result;
}

/**
 * Installs the failure hooks and the signal handlers. Idempotent per process:
 * the first trigger wins, a later signal does not restart or extend the stop,
 * and a failure that arrives mid-stop does not start a second one.
 *
 * A stop that succeeds exits with the trigger's own code (0 for a signal). A
 * stop that failed or expired exits non-zero even from a signal, because the
 * resources were not released and a supervisor that sees 0 would record a clean
 * shutdown that did not happen.
 */
export function installLifecycleGuards(options: LifecycleGuardOptions): LifecycleGuardHandle {
  const { target, stop, exit, deadlineMs = DEFAULT_SHUTDOWN_DEADLINE_MS } = options;
  const log: LifecycleLogger =
    options.log ??
    ((level, message, meta) => {
      const line = `[VMNL-LIFECYCLE] ${message}`;
      if (level === "ERROR") console.error(line, meta ?? "");
      else if (level === "WARN") console.warn(line, meta ?? "");
      else console.log(line, meta ?? "");
    });

  let isShuttingDown = false;
  let hasFinished = false;

  const shutdown = async (trigger: string, exitCode: number): Promise<void> => {
    if (isShuttingDown) {
      log("WARN", `Ignoring ${trigger}: a shutdown triggered by another source is already in progress.`);
      return;
    }
    isShuttingDown = true;
    log("INFO", `Shutdown triggered by ${trigger}; allowing ${deadlineMs}ms to release resources.`);

    const result = await stopWithinDeadline(stop, deadlineMs);
    hasFinished = true;

    if (result.outcome === "stopped") {
      log("INFO", `Shutdown complete (${trigger}).`);
      exit(exitCode);
      return;
    }

    // A stop that did not complete leaves connections bound, the queue worker
    // running and the durable journal undrained. Exiting 0 would tell the
    // supervisor the release was clean.
    const failureCode = exitCode === 0 ? 1 : exitCode;
    if (result.outcome === "timed_out") {
      log(
        "ERROR",
        `Shutdown exceeded the ${deadlineMs}ms deadline during ${trigger}; exiting ${failureCode} so the reason is recorded before the orchestrator SIGKILLs this instance.`,
        { deadlineMs, trigger }
      );
    } else {
      log("ERROR", `Shutdown failed during ${trigger}: ${describe(result.error)}`, { trigger });
    }
    exit(failureCode);
  };

  const onFatal = (kind: "unhandledRejection" | "uncaughtException", error: unknown): void => {
    if (isShuttingDown || hasFinished) {
      log("ERROR", `${kind} arrived while shutting down: ${describe(error)}`);
      return;
    }
    log("ERROR", `${kind} reached the process with no handler: ${describe(error)}`);
    void shutdown(kind, 1);
  };

  target.on("unhandledRejection", (reason) => onFatal("unhandledRejection", reason));
  target.on("uncaughtException", (error) => onFatal("uncaughtException", error));
  target.on("SIGTERM", () => void shutdown("SIGTERM", 0));
  target.on("SIGINT", () => void shutdown("SIGINT", 0));

  return {
    shutdown,
    started: () => isShuttingDown,
    finished: () => hasFinished,
  };
}
