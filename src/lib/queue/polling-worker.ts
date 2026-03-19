import { Worker, type Job } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, enqueuePolling } from './index';
import {
  queryGenerateResult,
  queryFissionResult,
  queryPrintResult,
  queryExtractResult,
} from '@/lib/api/chcyai';
import prisma from '@/lib/db';

interface PollingJobData {
  jobId: string;
  externalTaskId: string;
  type: string;
  attempt: number;
}

// Map type → query function
const queryFunctions: Record<string, (taskId: string) => Promise<any>> = {
  generate: queryGenerateResult,
  fission: queryFissionResult,
  print: queryPrintResult,
  extract: queryExtractResult,
};

async function processPolling(job: Job<PollingJobData>): Promise<void> {
  const { jobId, externalTaskId, type, attempt } = job.data;

  console.log(`[Polling] Checking ${type} job ${jobId}, attempt ${attempt}`);

  // Check if already processed (callback may have arrived)
  const dbJob = await prisma.job.findUnique({ where: { id: jobId } });
  if (!dbJob) return;
  if (dbJob.status === 'SUCCESS' || dbJob.status === 'FAILED') {
    console.log(`[Polling] Job ${jobId} already ${dbJob.status}, skipping poll`);
    return;
  }

  try {
    const queryFn = queryFunctions[type];
    if (!queryFn) throw new Error(`No query function for type: ${type}`);

    const result = await queryFn(externalTaskId);

    if (result.status === 'EXECUTE_SUCCESS' && result.data) {
      // Task completed successfully
      console.log(`[Polling] Job ${jobId} completed via polling`);

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'SUCCESS',
          result: {
            generateImageId: result.data.generateImageId,
            deductibleAmount: result.data.deductibleAmount,
          },
          cost: result.data.deductibleAmount,
          completedAt: new Date(),
        },
      });

      // Create asset
      const params = dbJob.params as any;
      await prisma.asset.create({
        data: {
          userId: dbJob.userId,
          projectId: params?.projectId || null,
          jobId: dbJob.id,
          type: dbJob.type,
          fileId: result.data.generateImageId,
          fileName: params?.fileName || null,
          metadata: {
            prompt: params?.prompt,
            jobType: dbJob.type,
            externalTaskId,
            resolvedViaPolling: true,
          },
        },
      });

      // Update project asset count
      if (params?.projectId) {
        await prisma.project.update({
          where: { id: params.projectId },
          data: { assetCount: { increment: 1 } },
        }).catch(() => {}); // Ignore if project doesn't exist
      }

      // Update batch item if applicable
      await updateBatchItemIfNeeded(dbJob.id, 'SUCCESS', result.data);

    } else if (result.status === 'EXECUTE_ERROR') {
      // Task failed
      console.log(`[Polling] Job ${jobId} failed via polling`);

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: result.error || { code: 'TASK_FAILED', message: 'Task failed' },
          completedAt: new Date(),
        },
      });

      await updateBatchItemIfNeeded(dbJob.id, 'FAILED', null);

    } else {
      // Still processing, schedule next poll
      if (attempt < 15) {
        // Exponential backoff: 10s, 20s, 40s, 60s, 60s, 60s...
        const delay = Math.min(10000 * Math.pow(2, attempt), 60000);
        console.log(`[Polling] Job ${jobId} still processing, next poll in ${delay}ms`);
        await enqueuePolling(jobId, externalTaskId, type, attempt + 1, delay);
      } else {
        // Max polling attempts reached
        console.error(`[Polling] Job ${jobId} timed out after ${attempt} polls`);
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: { code: 'POLLING_TIMEOUT', message: `Timed out after ${attempt} polling attempts` },
            completedAt: new Date(),
          },
        });
        await updateBatchItemIfNeeded(dbJob.id, 'FAILED', null);
      }
    }
  } catch (error: any) {
    // Network errors etc - retry polling
    if (attempt < 15) {
      const delay = Math.min(10000 * Math.pow(2, Math.min(attempt, 4)), 60000);
      console.warn(`[Polling] Error polling job ${jobId}: ${error.message}, retrying in ${delay}ms`);
      await enqueuePolling(jobId, externalTaskId, type, attempt + 1, delay);
    } else {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: { code: 'POLLING_ERROR', message: error.message },
          completedAt: new Date(),
        },
      });
    }
  }
}

async function updateBatchItemIfNeeded(jobId: string, status: string, resultData: any): Promise<void> {
  const batchItem = await prisma.batchJobItem.findFirst({
    where: { jobId },
  });

  if (!batchItem) return;

  await prisma.batchJobItem.update({
    where: { id: batchItem.id },
    data: {
      status,
      result: resultData || undefined,
    },
  });

  // Update batch job counts atomically
  const incrementField = status === 'SUCCESS' ? 'successCount' : 'failedCount';
  const batch = await prisma.batchJob.update({
    where: { id: batchItem.batchJobId },
    data: {
      [incrementField]: { increment: 1 },
      runningCount: { decrement: 1 },
    },
  });

  // Check if batch is complete
  if (batch.successCount + batch.failedCount >= batch.totalCount) {
    const finalStatus = batch.failedCount > 0 ? 'PARTIAL_FAILED' : 'COMPLETED';
    await prisma.batchJob.update({
      where: { id: batch.id },
      data: { status: finalStatus, completedAt: new Date() },
    });
  }
}

export function startPollingWorker(): Worker {
  const connection = getRedisConnection() as any;

  const worker = new Worker(
    QUEUE_NAMES.POLLING,
    async (job) => processPolling(job as Job<PollingJobData>),
    {
      connection,
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Polling] Job ${job?.id} failed:`, err.message);
  });

  console.log('[Worker] Started polling worker (concurrency: 10)');
  return worker;
}
