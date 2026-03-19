import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minio',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minio123',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || 'pod-ai-studio';

/**
 * Upload a file buffer to S3.
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = 'image/png',
): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${BUCKET}/${key}`;
}

/**
 * Generate a presigned download URL (5 min expiry).
 */
export async function getPresignedUrl(key: string, expiresIn: number = 300): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a storage key for an asset.
 */
export function assetKey(userId: string, assetId: string, suffix: string = 'original.png'): string {
  return `assets/${userId}/${assetId}/${suffix}`;
}

/**
 * Generate a storage key for a thumbnail.
 */
export function thumbnailKey(userId: string, assetId: string): string {
  return `assets/${userId}/${assetId}/thumb.webp`;
}

/**
 * Download a file from a URL and upload it to S3.
 */
export async function cacheFromUrl(
  url: string,
  key: string,
  contentType: string = 'image/png',
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return uploadToS3(key, buffer, contentType);
}
