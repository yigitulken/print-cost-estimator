// ============================================================
// Cloudflare R2 Client (S3-compatible)
// ============================================================

import { S3Client, CreateMultipartUploadCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables required
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;

// R2 multipart upload constants
export const PART_SIZE_BYTES = 16 * 1024 * 1024; // 16 MiB (minimum for S3 is 5 MiB)
export const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

/**
 * Get S3 client for Cloudflare R2
 */
export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error('R2 configuration missing. Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Get bucket name
 */
export function getR2Bucket(): string {
  if (!R2_BUCKET) {
    throw new Error('R2_BUCKET environment variable not set');
  }
  return R2_BUCKET;
}

/**
 * Initiate multipart upload
 */
export async function initiateMultipartUpload(key: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const response = await client.send(command);
  
  if (!response.UploadId) {
    throw new Error('Failed to initiate multipart upload: no UploadId returned');
  }

  return response.UploadId;
}

/**
 * Generate presigned URL for uploading a part
 */
export async function getPresignedPartUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  // Use GetObjectCommand with query parameters for part upload
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  // Add query parameters for multipart upload
  const url = await getSignedUrl(client, command as any, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });

  // Manually add uploadId and partNumber query parameters
  const urlObj = new URL(url);
  urlObj.searchParams.set('uploadId', uploadId);
  urlObj.searchParams.set('partNumber', partNumber.toString());

  return urlObj.toString();
}

/**
 * Complete multipart upload
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ PartNumber: number; ETag: string }>
): Promise<void> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  // Sort parts by PartNumber (required by S3)
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });

  await client.send(command);
}

/**
 * Abort multipart upload (cleanup on failure)
 */
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  try {
    const client = getR2Client();
    const bucket = getR2Bucket();

    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });

    await client.send(command);
  } catch (error) {
    // Log but don't throw - this is cleanup
    console.error('Failed to abort multipart upload:', error);
  }
}

/**
 * Get object metadata
 */
export async function getObjectMetadata(key: string): Promise<{ size: number; contentType?: string }> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType,
  };
}

/**
 * Get readable stream for object
 */
export async function getObjectStream(key: string): Promise<NodeJS.ReadableStream> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error('No body in response');
  }

  return response.Body as unknown as NodeJS.ReadableStream;
}
