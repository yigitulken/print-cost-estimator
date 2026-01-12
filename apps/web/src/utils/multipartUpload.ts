// ============================================================
// Multipart Upload Helper - Direct-to-R2 Upload with Progress
// ============================================================

import type { AnalysisResult, ApiError } from '@print-cost/shared';

export interface MultipartProgressEvent {
  phase: 'initializing' | 'uploading' | 'completing' | 'analyzing';
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  currentPart?: number;
  totalParts?: number;
}

/**
 * Upload STL file via R2 multipart upload and analyze
 * Returns analysis result
 */
export async function analyzeViaMultipart(
  file: File,
  onProgress?: (event: MultipartProgressEvent) => void
): Promise<AnalysisResult> {
  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : '';

  // Phase 1: Initialize upload
  onProgress?.({
    phase: 'initializing',
    uploadedBytes: 0,
    totalBytes: file.size,
    percentage: 0,
  });

  let initResponse;
  try {
    const initRes = await fetch(`${API_BASE}/api/uploads/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        contentType: 'application/octet-stream',
      }),
    });

    if (!initRes.ok) {
      const errorData = await initRes.json() as ApiError;
      throw {
        code: errorData.error.code,
        message: errorData.error.message,
      };
    }

    initResponse = await initRes.json() as {
      token: string;
      key: string;
      uploadId: string;
      partSize: number;
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    throw {
      code: 'network_error',
      message: 'Failed to initialize upload. Please try again.',
    };
  }

  const { token, partSize } = initResponse;

  // Phase 2: Upload parts sequentially
  const totalParts = Math.ceil(file.size / partSize);
  const parts: Array<{ partNumber: number; etag: string }> = [];
  let uploadedBytes = 0;

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    // Get presigned URL for this part
    let partUrlResponse;
    try {
      const partUrlRes = await fetch(`${API_BASE}/api/uploads/part-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, partNumber }),
      });

      if (!partUrlRes.ok) {
        const errorData = await partUrlRes.json() as ApiError;
        throw {
          code: errorData.error.code,
          message: errorData.error.message,
        };
      }

      partUrlResponse = await partUrlRes.json() as { url: string };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      throw {
        code: 'network_error',
        message: 'Failed to get upload URL. Please try again.',
      };
    }

    // Calculate part range
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const partBlob = file.slice(start, end);

    // Upload part via presigned URL
    let etag: string;
    try {
      const uploadRes = await fetch(partUrlResponse.url, {
        method: 'PUT',
        body: partBlob,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload part ${partNumber}: ${uploadRes.status} ${uploadRes.statusText}`);
      }

      // Extract ETag from response headers
      const etagHeader = uploadRes.headers.get('ETag');
      if (!etagHeader) {
        throw new Error(`Missing ETag header for part ${partNumber}. Server may not support multipart upload correctly.`);
      }

      etag = etagHeader;
    } catch (error) {
      throw {
        code: 'upload_error',
        message: error instanceof Error ? error.message : 'Failed to upload file part',
      };
    }

    parts.push({ partNumber, etag });
    uploadedBytes += (end - start);

    // Report progress
    onProgress?.({
      phase: 'uploading',
      uploadedBytes,
      totalBytes: file.size,
      percentage: (uploadedBytes / file.size) * 95, // Reserve 5% for completing & analyzing
      currentPart: partNumber,
      totalParts,
    });
  }

  // Phase 3: Complete multipart upload
  onProgress?.({
    phase: 'completing',
    uploadedBytes: file.size,
    totalBytes: file.size,
    percentage: 95,
  });

  try {
    const completeRes = await fetch(`${API_BASE}/api/uploads/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, parts }),
    });

    if (!completeRes.ok) {
      const errorData = await completeRes.json() as ApiError;
      throw {
        code: errorData.error.code,
        message: errorData.error.message,
      };
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    throw {
      code: 'network_error',
      message: 'Failed to complete upload. Please try again.',
    };
  }

  // Phase 4: Analyze uploaded file
  onProgress?.({
    phase: 'analyzing',
    uploadedBytes: file.size,
    totalBytes: file.size,
    percentage: 97,
  });

  try {
    const analyzeRes = await fetch(`${API_BASE}/api/analyze-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!analyzeRes.ok) {
      const errorData = await analyzeRes.json() as ApiError;
      throw {
        code: errorData.error.code,
        message: errorData.error.message,
      };
    }

    const result = await analyzeRes.json() as AnalysisResult;

    // Final progress update
    onProgress?.({
      phase: 'analyzing',
      uploadedBytes: file.size,
      totalBytes: file.size,
      percentage: 100,
    });

    return result;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    throw {
      code: 'network_error',
      message: 'Failed to analyze file. Please try again.',
    };
  }
}
