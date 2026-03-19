import { Worker, type Job } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, enqueuePolling } from './index';
import {
  createGenerateTask,
  createFissionTask,
  createPrintTask,
  createExtractTask,
} from '@/lib/api/chcyai';
import prisma from '@/lib/db';

const CALLBACK_URL = process.env.CALLBACK_URL || 'https://your-domain.com/api/callback';

interface TaskJobData {
  jobId: string;
  type: string;
  params: Record<string, unknown>;
}

async function processTask(job: Job<TaskJobData>): Promise<void> {
  const { jobId, type, params } = job.data;

  console.log(`[Worker] Processing ${type} job: ${jobId}`);

  // Get the job from DB
  const dbJob = await prisma.job.findUnique({ where: { id: jobId } });
  if (!dbJob) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Skip if already completed
  if (dbJob.status === 'SUCCESS' || dbJob.status === 'FAILED') {
    console.log(`[Worker] Job ${jobId} already ${dbJob.status}, skipping`);
    return;
  }

  try {
    let externalTaskId: string;
    const callbackUrl = CALLBACK_URL;

    switch (type) {
      case 'generate': {
        const result = await createGenerateTask({
          callbackUrl,
          prompt: params.prompt as string,
          referenceImageIdList: params.referenceImageIds as string[] | undefined,
          aspectRatioId: params.aspectRatioId as number | undefined,
          resolutionRatioId: params.resolutionRatioId as number,
          fileName: params.fileName as string | undefined,
        });
        externalTaskId = result.data;
        break;
      }
      case 'fission': {
        const result = await createFissionTask({
          callbackUrl,
          referenceImageId: params.referenceImageId as string,
          prompt: params.prompt as string | undefined,
          similarity: params.similarity as number,
          resolutionRatioId: params.resolutionRatioId as number,
          aspectRatio: params.aspectRatio as number,
          fileName: params.fileName as string | undefined,
        });
        externalTaskId = result.data;
        break;
      }
      case 'print': {
        const result = await createPrintTask({
          callbackUrl,
          referenceImageId: params.referenceImageId as string | undefined,
          dpi: params.dpi as number,
          imageWidth: params.imageWidth as number,
          imageHeight: params.imageHeight as number,
          selectedArea: params.selectedArea as any,
          fileName: params.fileName as string | undefined,
        });
        externalTaskId = result.data;
        break;
      }
      case 'extract': {
        const result = await createExtractTask({
          callbackUrl,
          referenceImageId: params.referenceImageId as string,
          prompt: params.prompt as string | undefined,
          resolutionRatioId: params.resolutionRatioId as number,
          isPatternCompleted: (params.isPatternCompleted as number) ?? 0,
          fileName: params.fileName as string | undefined,
        });
        externalTaskId = result.data;
        break;
      }
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    // Update DB with external task ID
    await prisma.job.update({
      where: { id: jobId },
      data: {
        externalTaskId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    console.log(`[Worker] Job ${jobId} submitted. External ID: ${externalTaskId}`);

    // Schedule polling fallback (first poll at 10s)
    await enqueuePolling(jobId, externalTaskId, type, 0, 10000);

  } catch (error: any) {
    const isRetryable = !['INSUFFICIENT_BALANCE', 'INVALID_SIGNATURE', 'PARAM_ERROR'].includes(error.code);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: isRetryable ? 'RETRYING' : 'FAILED',
        error: { code: error.code || 'UNKNOWN', message: error.message },
        retryCount: { increment: 1 },
      },
    });

    if (!isRetryable) {
      console.error(`[Worker] Job ${jobId} failed permanently: ${error.code}`);
      // Don't rethrow, so BullMQ doesn't retry
      return;
    }

    // Rethrow so BullMQ retries with exponential backoff
    throw error;
  }
}

// Concurrency settings per queue type
const CONCURRENCY = {
  [QUEUE_NAMES.GENERATE]: 5,
  [QUEUE_NAMES.FISSION]: 5,
  [QUEUE_NAMES.PRINT]: 8,
  [QUEUE_NAMES.EXTRACT]: 5,
};

export function startTaskWorkers(): Worker[] {
  const connection = getRedisConnection() as any;
  const workers: Worker[] = [];

  for (const [queueName, concurrency] of Object.entries(CONCURRENCY)) {
    const worker = new Worker(
      queueName,
      async (job) => processTask(job as Job<TaskJobData>),
      {
        connection,
        concurrency,
        limiter: {
          max: 10,
          duration: 60000, // Max 10 per minute per queue
        },
      },
    );

    worker.on('completed', (job) => {
      console.log(`[Worker:${queueName}] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[Worker:${queueName}] Job ${job?.id} failed:`, err.message);
    });

    workers.push(worker);
    console.log(`[Worker] Started ${queueName} worker (concurrency: ${concurrency})`);
  }

  return workers;
}
