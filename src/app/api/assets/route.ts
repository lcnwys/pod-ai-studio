import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = req.headers.get('x-user-id') || 'demo-user-id';
  const type = url.searchParams.get('type') || undefined;
  const projectId = url.searchParams.get('projectId') || undefined;
  const isFavorited = url.searchParams.get('isFavorited') === 'true' ? true : undefined;
  const search = url.searchParams.get('search') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '24');

  const where: any = { userId };
  if (type) where.type = type;
  if (projectId) where.projectId = projectId;
  if (isFavorited !== undefined) where.isFavorited = isFavorited;
  if (search) {
    where.OR = [
      { fileName: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return NextResponse.json({ data: assets, total, page, pageSize });
}
