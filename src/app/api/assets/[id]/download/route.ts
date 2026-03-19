import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { getFileDownloadUrl } from '@/lib/api/chcyai';
import { getPresignedUrl } from '@/lib/storage';

// GET /api/assets/[id]/download — Get download URL for an asset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(req.headers);
    const asset = await prisma.asset.findUnique({ where: { id: params.id } });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try S3 presigned URL first (cached file)
    if (asset.s3Key) {
      const url = await getPresignedUrl(asset.s3Key, 600);
      return NextResponse.json({ url, source: 's3' });
    }

    // Fall back to ChcyAI download URL
    if (asset.fileId) {
      const url = await getFileDownloadUrl(asset.fileId);
      return NextResponse.json({ url, source: 'chcyai' });
    }

    return NextResponse.json({ error: 'No file available' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
