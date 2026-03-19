import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { enqueueBatchDispatch } from '@/lib/queue';

// GET /api/batch — List batch jobs
export async function GET(req: NextRequest) {
  const userId = getUserId(req.headers);
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

  const [batches, total] = await Promise.all([
    prisma.batchJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.batchJob.count({ where: { userId } }),
  ]);

  return NextResponse.json({ data: batches, total, page, pageSize });
}

// POST /api/batch — Create a batch job and dispatch to queue
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req.headers);
    const body = await req.json();
    const { type, name, items, columnMapping, projectId } = body;

    if (!type || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const validTypes = ['generate', 'fission', 'print', 'extract'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    // Create batch job
    const batchJob = await prisma.batchJob.create({
      data: {
        userId,
        type,
        name: name || `Batch ${type} - ${new Date().toISOString().slice(0, 16)}`,
        status: 'PENDING',
        sourceFileName: body.sourceFileName,
        columnMapping: columnMapping || {},
        totalCount: items.length,
      },
    });

    // Create batch job items
    const batchItems = await Promise.all(
      items.map((item: Record<string, unknown>, index: number) =>
        prisma.batchJobItem.create({
          data: {
            batchJobId: batchJob.id,
            rowIndex: index,
            status: 'PENDING',
            params: { ...item, projectId },
          },
        }),
      ),
    );

    // Dispatch to BullMQ for chunked processing
    try {
      await enqueueBatchDispatch(batchJob.id);
    } catch (queueError: any) {
      console.warn('[Batch API] Queue unavailable:', queueError.message);
    }

    return NextResponse.json({
      id: batchJob.id,
      totalCount: batchJob.totalCount,
      itemIds: batchItems.map((b) => b.id),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
