/**
 * VMNL Enterprise Background Queue & Job Worker Engine
 * Authority: VMNL-AZP-VMN-CCPP-001 §19, §21 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 *
 * Implements high-throughput asynchronous job processing:
 * - EPG Generation & XMLTV Syndication
 * - Asynchronous Notification Delivery (SMTP/SES & Termii)
 * - Outgoing Webhook Dispatch with Exponential Backoff
 * - Nightly Playout & Bank Reconciliation Runs
 * - Full Dead-Letter Queue (DLQ) & Metric Instrumentation
 */

import { TelemetryService } from "../observability/index.js";

export type JobType =
  | "EPG_GENERATION"
  | "NOTIFICATION_DELIVERY"
  | "WEBHOOK_DISPATCH"
  | "RECONCILIATION_RUN";

export type JobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "DEAD_LETTER";

export interface QueueJob<T = any> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  priority: number; // 1 (highest) to 10 (lowest)
  attempts: number;
  maxRetries: number;
  backoffDelayMs: number;
  nextAttemptAt?: Date;
  lastError?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface JobEnqueueOptions {
  priority?: number;
  maxRetries?: number;
  initialBackoffDelayMs?: number;
}

export type JobHandler<T = any, R = any> = (job: QueueJob<T>) => Promise<R>;

export interface QueueMetrics {
  totalEnqueued: number;
  totalProcessed: number;
  totalFailed: number;
  totalDeadLetter: number;
  activeCount: number;
  pendingCount: number;
}

export class EnterpriseQueueWorker {
  private jobs = new Map<string, QueueJob>();
  private handlers = new Map<JobType, JobHandler>();
  private isRunning = false;
  private processingPromise: Promise<void> | null = null;
  private concurrency: number;
  private recurringTimers = new Set<NodeJS.Timeout>();
  private telemetry?: TelemetryService;
  // Terminal-state TTL: completed/failed/dead-lettered jobs are evicted after
  // this window so the jobs Map cannot grow unbounded on long-lived processes
  // (AUD-16).
  private terminalJobTtlMs: number;

  constructor(options?: { concurrency?: number; telemetry?: TelemetryService; terminalJobTtlMs?: number }) {
    this.concurrency = options?.concurrency || 5;
    this.telemetry = options?.telemetry;
    this.terminalJobTtlMs = options?.terminalJobTtlMs ?? 60 * 60_000; // 1 hour
  }

  /**
   * Evicts terminal-state jobs older than the retention TTL (AUD-16).
   */
  private pruneTerminalJobs(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (
        (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "DEAD_LETTER") &&
        job.updatedAt.getTime() + this.terminalJobTtlMs < now
      ) {
        this.jobs.delete(id);
      }
    }
  }

  /**
   * Schedules a recurring job with a defined interval (e.g. rolling 7-day EPG syndication).
   */
  public scheduleRecurring<T>(
    type: JobType,
    intervalMs: number,
    payloadGenerator: () => T,
    options?: JobEnqueueOptions
  ): NodeJS.Timeout {
    this.enqueue(type, payloadGenerator(), options);

    const timer = setInterval(() => {
      this.enqueue(type, payloadGenerator(), options);
    }, intervalMs);

    this.recurringTimers.add(timer);
    return timer;
  }

  /**
   * Stops a scheduled recurring job timer.
   */
  public stopRecurring(timer: NodeJS.Timeout): void {
    clearInterval(timer);
    this.recurringTimers.delete(timer);
  }

  /**
   * Stops all scheduled recurring timers.
   */
  public stopAllRecurring(): void {
    for (const timer of this.recurringTimers) {
      clearInterval(timer);
    }
    this.recurringTimers.clear();
  }

  /**
   * Registers a dedicated processing handler for a specific JobType.
   */
  public registerHandler<T, R>(type: JobType, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler);
  }

  /**
   * Enqueues a new background task into the queue.
   */
  public enqueue<T>(type: JobType, payload: T, options?: JobEnqueueOptions): QueueJob<T> {
    const id = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const job: QueueJob<T> = {
      id,
      type,
      payload,
      status: "QUEUED",
      priority: options?.priority ?? 5,
      attempts: 0,
      maxRetries: options?.maxRetries ?? 3,
      backoffDelayMs: options?.initialBackoffDelayMs ?? 200,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(id, job);
    this.telemetry?.recordMetric("queue_job_enqueued_total", 1, { type });

    return job;
  }

  /**
   * Retrieves a job by ID.
   */
  public getJob(id: string): QueueJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Lists jobs filtered by status or type.
   */
  public listJobs(filter?: { status?: JobStatus; type?: JobType }): QueueJob[] {
    let list = Array.from(this.jobs.values());
    if (filter?.status) {
      list = list.filter((j) => j.status === filter.status);
    }
    if (filter?.type) {
      list = list.filter((j) => j.type === filter.type);
    }
    return list;
  }

  /**
   * Executes a single processing pass over queued items up to concurrency limit.
   */
  public async processNextBatch(options?: { ignoreDelay?: boolean }): Promise<number> {
    this.pruneTerminalJobs();
    const now = new Date();
    const ignoreDelay = options?.ignoreDelay ?? false;
    const pendingJobs = Array.from(this.jobs.values())
      .filter((j) => j.status === "QUEUED" && (ignoreDelay || !j.nextAttemptAt || j.nextAttemptAt <= now))
      .sort((a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, this.concurrency);

    if (pendingJobs.length === 0) return 0;

    await Promise.all(pendingJobs.map((job) => this.executeJob(job)));
    return pendingJobs.length;
  }

  /**
   * Starts background processing loop.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.processingPromise = (async () => {
      while (this.isRunning) {
        const processed = await this.processNextBatch();
        if (processed === 0) {
          // Idle backoff
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    })();
  }

  /**
   * Stops background processing gracefully.
   */
  public async stop(): Promise<void> {
    this.stopAllRecurring();
    this.isRunning = false;
    if (this.processingPromise) {
      await this.processingPromise;
      this.processingPromise = null;
    }
  }

  /**
   * Returns current queue metrics and health.
   */
  public getMetrics(): QueueMetrics {
    const all = Array.from(this.jobs.values());
    return {
      totalEnqueued: all.length,
      totalProcessed: all.filter((j) => j.status === "COMPLETED").length,
      totalFailed: all.filter((j) => j.status === "FAILED").length,
      totalDeadLetter: all.filter((j) => j.status === "DEAD_LETTER").length,
      activeCount: all.filter((j) => j.status === "PROCESSING").length,
      pendingCount: all.filter((j) => j.status === "QUEUED").length,
    };
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private async executeJob(job: QueueJob): Promise<void> {
    const handler = this.handlers.get(job.type);
    job.status = "PROCESSING";
    job.attempts += 1;
    job.updatedAt = new Date();

    if (!handler) {
      job.status = "DEAD_LETTER";
      job.lastError = `No registered handler for JobType: ${job.type}`;
      this.telemetry?.recordMetric("queue_job_dead_letter_total", 1, { type: job.type });
      return;
    }

    try {
      const result = await handler(job);
      job.status = "COMPLETED";
      job.result = result;
      job.processedAt = new Date();
      job.updatedAt = new Date();
      this.telemetry?.recordMetric("queue_job_completed_total", 1, { type: job.type });
    } catch (err: any) {
      job.lastError = err?.message || String(err);
      job.updatedAt = new Date();

      if (job.attempts <= job.maxRetries) {
        // Schedule retry with exponential backoff and jitter
        job.status = "QUEUED";
        if (job.backoffDelayMs > 0) {
          const delay = Math.min(job.backoffDelayMs * 2, 300_000); // capped at 5 minutes
          const jitter = Math.floor(Math.random() * 50);
          job.backoffDelayMs = delay;
          job.nextAttemptAt = new Date(Date.now() + delay + jitter);
        } else {
          job.nextAttemptAt = undefined;
        }
        this.telemetry?.recordMetric("queue_job_retry_total", 1, { type: job.type });
      } else {
        job.status = "DEAD_LETTER";
        this.telemetry?.recordMetric("queue_job_dead_letter_total", 1, { type: job.type });
      }
    }
  }
}

/**
 * Configures automated 7-day rolling EPG syndication schedule (B-14).
 */
export function configureRollingEpgScheduler(
  worker: EnterpriseQueueWorker,
  intervalMs: number = 86_400_000 // 24 hours daily rolling
): NodeJS.Timeout {
  return worker.scheduleRecurring(
    "EPG_GENERATION",
    intervalMs,
    () => ({
      channelCodes: ["NXTR", "ORIS", "IMBD"],
      rollingDays: 7,
      generatedAt: new Date().toISOString(),
    })
  );
}
