import { Worker, type Job } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, enqueueTask } from './index';
import prisma from '@/lib/db';

interface BatchDispatchData {
  batchJobId: string;
}

const BATCH_CHUNK_SIZE = 20; // Push 20 items at a time
const CHUNK_DELAY = 2000; // 2s between chunks

async function processBatchDispatch(job: Job<BatchDispatchData>): Promise<void> {
  const { batchJobId } = job.data;

  console.log(`[Batch] Dispatching batch job: ${batchJobId}`);

  const batchJob = await prisma.batchJob.findUnique({
    where: { id: batchJobId },
  });

  if (!batchJob) {
    throw new Error(`Batch job not found: ${batchJobId}`);
  }

  // Get all pending items
  const items = await prisma.batchJobItem.findMany({
    where: { batchJobId, status: 'PENDING' },
    orderBy: { rowIndex: 'asc' },
  });

  if (items.length === 0) {
    console.log(`[Batch] No pending items for batch ${batchJobId}`);
    return;
  }

  // Update batch status
  await prisma.batchJob.update({
    where: { id: batchJobId },
    data: { status: 'RUNNING' },
  });

  // Process in chunks
  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    const chunk = items.slice(i, i + BATCH_CHUNK_SIZE);

    for (const item of chunk) {
      try {
        // Create individual job record
        const individualJob = await prisma.job.create({
          data: {
            userId: batchJob.userId,
            type: batchJob.type,
            status: 'PENDING',
            params: item.params as any,
          },
        });

        // Link batch item to job
        await prisma.batchJobItem.update({
          where: { id: item.id },
          data: { jobId: individualJob.id, status: 'QUEUED' },
        });

        // Enqueue the task with lower priority (batch = 10, single = 1)
        await enqueueTask(batchJob.type, individualJob.id, {
          params: item.params,
        }, { priority: 10 });

        // Update running count
        await prisma.batchJob.update({
          where: { id: batchJobId },
          data: { runningCount: { increment: 1 } },
        });

      } catch (error: any) {
        console.error(`[Batch] Failed to dispatch item ${item.id}:`, error.message);
        await prisma.batchJobItem.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            error: { code: 'DISPATCH_ERROR', message: error.message },
          },
        });
        await prisma.batchJob.update({
          where: { id: batchJobId },
          data: { failedCount: { increment: 1 } },
        });
      }
    }

    // Delay between chunks to avoid queue flooding
    if (i + BATCH_CHUNK_SIZE < items.length) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY));
    }
  }

  console.log(`[Batch] Dispatched ${items.length} items for batch ${batchJobId}`);
}

export function startBatchWorker(): Worker {
  const connection = getRedisConnection() as any;

  const worker = new Worker(
    QUEUE_NAMES.BATCH_DISPATCH,
    async (job) => processBatchDispatch(job as Job<BatchDispatchData>),
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Batch] Dispatch job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Batch] Dispatch job ${job?.id} failed:`, err.message);
  });

  console.log('[Worker] Started batch dispatch worker (concurrency: 2)');
  return worker;
}
