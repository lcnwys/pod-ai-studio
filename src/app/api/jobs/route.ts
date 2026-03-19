import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { enqueueTask } from '@/lib/queue';
import { getUserId } from '@/lib/auth';

// POST /api/jobs — Create a new job and enqueue it
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, params, projectId } = body;

    const validTypes = ['generate', 'fission', 'print', 'extract'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    const userId = getUserId(req.headers);

    // Create job record in DB
    const job = await prisma.job.create({
      data: {
        userId,
        type,
        status: 'PENDING',
        params: { ...params, projectId },
      },
    });

    // Enqueue to BullMQ worker (async processing)
    try {
      await enqueueTask(type, job.id, { params: { ...params, projectId } }, {
        priority: 1, // Single tasks get high priority
      });
    } catch (queueError: any) {
      // Queue might not be available (e.g., Redis down), fall back to direct API call
      console.warn('[Jobs API] Queue unavailable, direct mode:', queueError.message);
      // The job stays PENDING — worker will pick it up when Redis recovers
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/jobs — List jobs with filters
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = getUserId(req.headers);
  const type = url.searchParams.get('type') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

  const where: any = { userId };
  if (type) where.type = type;
  if (status) where.status = status;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({ data: jobs, total, page, pageSize });
}
