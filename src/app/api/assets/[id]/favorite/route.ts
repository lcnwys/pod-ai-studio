import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const updated = await prisma.asset.update({
    where: { id: params.id },
    data: { isFavorited: !asset.isFavorited },
  });

  return NextResponse.json(updated);
}
