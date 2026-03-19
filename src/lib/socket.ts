/**
 * Socket.IO event emitter helper.
 *
 * In the Next.js API routes context, we can't directly hold a Socket.IO
 * server instance. Instead, we use Redis pub/sub to broadcast events
 * that a standalone Socket.IO server (or the worker process) will pick up.
 */
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'pod:events';

let publisher: IORedis | null = null;

function getPublisher(): IORedis {
  if (!publisher) {
    publisher = new IORedis(REDIS_URL);
  }
  return publisher;
}

export interface TaskEvent {
  type: 'task:updated' | 'batch:progress' | 'batch:completed';
  userId: string;
  payload: Record<string, unknown>;
}

/**
 * Publish an event to all connected Socket.IO clients.
 */
export async function emitEvent(event: TaskEvent): Promise<void> {
  const pub = getPublisher();
  await pub.publish(CHANNEL, JSON.stringify(event));
}

/**
 * Emit a task status update event.
 */
export async function emitTaskUpdate(
  userId: string,
  jobId: string,
  status: string,
  result?: Record<string, unknown>,
): Promise<void> {
  await emitEvent({
    type: 'task:updated',
    userId,
    payload: { jobId, status, result },
  });
}

/**
 * Emit batch progress event.
 */
export async function emitBatchProgress(
  userId: string,
  batchJobId: string,
  progress: {
    total: number;
    success: number;
    failed: number;
    running: number;
    percent: number;
  },
): Promise<void> {
  await emitEvent({
    type: 'batch:progress',
    userId,
    payload: { batchJobId, ...progress },
  });
}
