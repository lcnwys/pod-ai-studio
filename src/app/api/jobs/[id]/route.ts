import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getUserId } from '@/lib/auth';
import { enqueueTask } from '@/lib/queue';

// GET /api/jobs/[id] — Get single job
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(job);
}

// POST /api/jobs/[id] — Retry a failed job
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(req.headers);
    const job = await prisma.job.findUnique({ where: { id: params.id } });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (job.status !== 'FAILED') {
      return NextResponse.json({ error: 'Only failed jobs can be retried' }, { status: 400 });
    }

    // Reset job status
    const updated = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'PENDING',
        error: Prisma.DbNull,
        externalTaskId: null,
        result: Prisma.DbNull,
        completedAt: null,
        retryCount: { increment: 1 },
      },
    });

    // Re-enqueue
    const jobParams = job.params as any;
    try {
      await enqueueTask(job.type, job.id, { params: jobParams }, {
        priority: 1,
      });
    } catch (queueError: any) {
      console.warn('[Jobs API] Queue unavailable for retry:', queueError.message);
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
