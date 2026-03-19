import { Queue, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared Redis connection
let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}

// Queue names
export const QUEUE_NAMES = {
  GENERATE: 'task-generate',
  FISSION: 'task-fission',
  PRINT: 'task-print',
  EXTRACT: 'task-extract',
  POLLING: 'task-polling',
  ASSET_PROCESS: 'asset-process',
  BATCH_DISPATCH: 'batch-dispatch',
} as const;

// Default job options
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

// Create queue helper
function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: getRedisConnection() as any,
    defaultJobOptions,
  });
}

// Lazy queue instances via refs (created on first use, not at import time)
function getOrCreateQueue(name: string, ref: { q: Queue | null }): Queue {
  if (!ref.q) {
    ref.q = createQueue(name);
  }
  return ref.q;
}

const refs = {
  generate: { q: null as Queue | null },
  fission: { q: null as Queue | null },
  print: { q: null as Queue | null },
  extract: { q: null as Queue | null },
  polling: { q: null as Queue | null },
  assetProcess: { q: null as Queue | null },
  batchDispatch: { q: null as Queue | null },
};

export const generateQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.GENERATE, refs.generate);
export const fissionQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.FISSION, refs.fission);
export const printQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.PRINT, refs.print);
export const extractQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.EXTRACT, refs.extract);
export const pollingQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.POLLING, refs.polling);
export const assetProcessQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.ASSET_PROCESS, refs.assetProcess);
export const batchDispatchQueue = (): Queue => getOrCreateQueue(QUEUE_NAMES.BATCH_DISPATCH, refs.batchDispatch);

// Get queue by job type
export function getQueueByType(type: string): Queue {
  switch (type) {
    case 'generate': return generateQueue();
    case 'fission': return fissionQueue();
    case 'print': return printQueue();
    case 'extract': return extractQueue();
    default: throw new Error(`Unknown job type: ${type}`);
  }
}

// Enqueue a task
export async function enqueueTask(
  type: string,
  jobId: string,
  data: Record<string, unknown>,
  options?: { priority?: number; delay?: number },
): Promise<void> {
  const queue = getQueueByType(type);
  await queue.add(`${type}:${jobId}`, {
    jobId,
    type,
    ...data,
  }, {
    priority: options?.priority ?? 5,
    delay: options?.delay,
    jobId: `task-${jobId}`, // Deduplication
  });
}

// Enqueue polling job (for callback fallback)
export async function enqueuePolling(
  jobId: string,
  externalTaskId: string,
  type: string,
  attempt: number = 0,
  delayMs: number = 10000,
): Promise<void> {
  await pollingQueue().add('poll', {
    jobId,
    externalTaskId,
    type,
    attempt,
  }, {
    delay: delayMs,
    jobId: `poll-${jobId}-${attempt}`, // Deduplication
    removeOnComplete: true,
    removeOnFail: { count: 100 },
  });
}

// Enqueue batch dispatch
export async function enqueueBatchDispatch(batchJobId: string): Promise<void> {
  await batchDispatchQueue().add('dispatch', {
    batchJobId,
  }, {
    jobId: `batch-${batchJobId}`,
  });
}
