import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToChcyai } from '@/lib/api/chcyai';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;

    // Upload to ChcyAI
    const fileId = await uploadFileToChcyai(buffer, fileName);

    // Save as asset (type=upload)
    const userId = req.headers.get('x-user-id') || 'demo-user-id';
    const asset = await prisma.asset.create({
      data: {
        userId,
        type: 'upload',
        fileId,
        fileName,
        fileSize: BigInt(buffer.length),
        metadata: { originalName: fileName, mimeType: file.type },
      },
    });

    return NextResponse.json({
      fileId,
      assetId: asset.id,
      thumbnailUrl: asset.thumbnailUrl,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
