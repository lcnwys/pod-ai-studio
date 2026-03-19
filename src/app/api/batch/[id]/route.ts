import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { enqueueBatchDispatch } from '@/lib/queue';

// GET /api/batch/[id] — Get batch job details with items
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(req.headers);

    const batch = await prisma.batchJob.findUnique({
      where: { id: params.id },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');

    const [items, totalItems] = await Promise.all([
      prisma.batchJobItem.findMany({
        where: { batchJobId: batch.id },
        orderBy: { rowIndex: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { job: { select: { id: true, status: true, result: true, error: true } } },
      }),
      prisma.batchJobItem.count({ where: { batchJobId: batch.id } }),
    ]);

    return NextResponse.json({
      batch,
      items: { data: items, total: totalItems, page, pageSize },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/batch/[id] — Retry failed items in a batch
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(req.headers);

    const batch = await prisma.batchJob.findUnique({
      where: { id: params.id },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (batch.status !== 'PARTIAL_FAILED' && batch.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Batch must be completed to retry failed items' }, { status: 400 });
    }

    // Reset failed items to PENDING
    const failedItems = await prisma.batchJobItem.findMany({
      where: { batchJobId: batch.id, status: 'FAILED' },
    });

    if (failedItems.length === 0) {
      return NextResponse.json({ error: 'No failed items to retry' }, { status: 400 });
    }

    await prisma.batchJobItem.updateMany({
      where: { batchJobId: batch.id, status: 'FAILED' },
      data: { status: 'PENDING', result: undefined },
    });

    // Reset batch counters
    await prisma.batchJob.update({
      where: { id: batch.id },
      data: {
        status: 'RUNNING',
        failedCount: 0,
        completedAt: null,
      },
    });

    // Re-dispatch
    try {
      await enqueueBatchDispatch(batch.id);
    } catch (queueError: any) {
      console.warn('[Batch API] Queue unavailable for retry:', queueError.message);
    }

    return NextResponse.json({ retryCount: failedItems.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
