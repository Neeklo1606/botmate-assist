import type { JobsOptions } from "bullmq";

/** Shared retry posture — exponential backoff + durable failed artifacts for DLQ forwarding. */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2500 },
  removeOnComplete: { count: 2000 },
  removeOnFail: false,
};
