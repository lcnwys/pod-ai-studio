import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { emitTaskUpdate } from '@/lib/socket';

// POST /api/callback — Receive task completion callback from ChcyAI
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, data, error } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    // Find the job by external task ID
    const job = await prisma.job.findUnique({
      where: { externalTaskId: taskId },
    });

    if (!job) {
      console.warn(`[Callback] Received for unknown taskId: ${taskId}`);
      return NextResponse.json({ ok: true }); // Idempotent
    }

    // Idempotent: already completed, skip
    if (job.status === 'SUCCESS' || job.status === 'FAILED') {
      return NextResponse.json({ ok: true, message: 'Already processed' });
    }

    const params = job.params as any;
    const projectId = params?.projectId || null;

    if (status === 'EXECUTE_SUCCESS' && data) {
      // ── Success ──
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'SUCCESS',
          result: {
            generateImageId: data.generateImageId,
            deductibleAmount: data.deductibleAmount,
          },
          cost: data.deductibleAmount,
          completedAt: new Date(),
        },
      });

      // Create asset record
      await prisma.asset.create({
        data: {
          userId: job.userId,
          projectId,
          jobId: job.id,
          type: job.type,
          fileId: data.generateImageId,
          fileName: params?.fileName || null,
          metadata: {
            prompt: params?.prompt,
            jobType: job.type,
            externalTaskId: taskId,
          },
        },
      });

      // Update project asset count
      if (projectId) {
        await prisma.project.update({
          where: { id: projectId },
          data: { assetCount: { increment: 1 } },
        }).catch(() => {}); // Ignore if project doesn't exist
      }

      // Update batch item if part of a batch
      await updateBatchItemIfNeeded(job.id, 'SUCCESS', data);

      // Emit real-time event via Redis pub/sub → Socket.IO
      await emitTaskUpdate(job.userId, job.id, 'SUCCESS', {
        generateImageId: data.generateImageId,
      }).catch((err) => console.warn('[Callback] Socket emit failed:', err.message));

      return NextResponse.json({ ok: true });
    } else {
      // ── Failure ──
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: error || { code: 'CALLBACK_ERROR', message: 'Task failed' },
          completedAt: new Date(),
        },
      });

      await updateBatchItemIfNeeded(job.id, 'FAILED', null);

      await emitTaskUpdate(job.userId, job.id, 'FAILED', {
        error: error || { code: 'CALLBACK_ERROR' },
      }).catch((err) => console.warn('[Callback] Socket emit failed:', err.message));

      return NextResponse.json({ ok: true });
    }
  } catch (err: any) {
    console.error('[Callback] Processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Update batch_job_items and batch_jobs counts if this job belongs to a batch.
 */
async function updateBatchItemIfNeeded(
  jobId: string,
  status: string,
  resultData: any,
): Promise<void> {
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
