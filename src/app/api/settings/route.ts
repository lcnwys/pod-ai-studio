import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserId } from '@/lib/auth';

// GET /api/settings — Get user settings
export async function GET(req: NextRequest) {
  const userId = getUserId(req.headers);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      chcyaiAccessKey: true,
      defaultCallbackUrl: true,
      balance: true,
      plan: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    // Mask AK - only show last 4 chars
    chcyaiAccessKey: user.chcyaiAccessKey
      ? `****${user.chcyaiAccessKey.slice(-4)}`
      : null,
  });
}

// PUT /api/settings — Update user API keys & callback URL
export async function PUT(req: NextRequest) {
  try {
    const userId = getUserId(req.headers);
    const body = await req.json();
    const { accessKey, secretKey, callbackUrl } = body;

    const data: Record<string, string> = {};
    if (accessKey) data.chcyaiAccessKey = accessKey;
    if (secretKey) data.chcyaiSecretKey = secretKey;
    if (callbackUrl !== undefined) data.defaultCallbackUrl = callbackUrl;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
