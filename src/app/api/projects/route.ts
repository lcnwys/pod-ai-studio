import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'demo-user-id';

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: projects });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'demo-user-id';
  const body = await req.json();

  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name,
      description: body.description,
      tags: body.tags || [],
    },
  });

  return NextResponse.json(project);
}
