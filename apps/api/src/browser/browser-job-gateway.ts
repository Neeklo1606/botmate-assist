import type { JobQueues } from "@botmate/jobs";

let browserQueues: JobQueues | null = null;

/** Wired from `server.ts` after lazy BullMQ bootstrap (`routes/notifications.ts`). */
export function setBrowserJobQueues(queues: JobQueues | null): void {
  browserQueues = queues;
}

export function getBrowserJobQueues(): JobQueues | null {
  return browserQueues;
}
