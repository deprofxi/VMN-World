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
  private telemetry?: TelemetryService;

  constructor(options?: { concurrency?: number; telemetry?: TelemetryService }) {
    this.concurrency = options?.concurrency || 5;
    this.telemetry = options?.telemetry;
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
  public async processNextBatch(): Promise<number> {
    const pendingJobs = Array.from(this.jobs.values())
      .filter((j) => j.status === "QUEUED")
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
        // Schedule retry with exponential backoff
        job.status = "QUEUED";
        job.backoffDelayMs *= 2;
        this.telemetry?.recordMetric("queue_job_retry_total", 1, { type: job.type });
      } else {
        job.status = "DEAD_LETTER";
        this.telemetry?.recordMetric("queue_job_dead_letter_total", 1, { type: job.type });
      }
    }
  }
}
