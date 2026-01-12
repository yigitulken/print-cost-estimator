import type { AnalysisResult, ApiError } from '@print-cost/shared';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  url: string;
  file: File;
  onProgress?: (event: UploadProgressEvent) => void;
}

/**
 * Upload file using XMLHttpRequest with progress tracking
 * Returns a promise that resolves with the API response
 */
export function uploadWithProgress({
  url,
  file,
  onProgress,
}: UploadOptions): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
          });
        }
      });
    }
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText) as AnalysisResult;
          resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse server response'));
        }
      } else {
        // Try to parse error response
        try {
          const errorData = JSON.parse(xhr.responseText) as ApiError;
          reject({
            code: errorData.error.code,
            message: errorData.error.message,
          });
        } catch {
          reject({
            code: 'unknown_error',
            message: 'Something went wrong. Please try again.',
          });
        }
      }
    });
    
    // Handle network errors
    xhr.addEventListener('error', () => {
      reject({
        code: 'network_error',
        message: 'Failed to connect to server. Please try again.',
      });
    });
    
    // Handle timeout
    xhr.addEventListener('timeout', () => {
      reject({
        code: 'timeout',
        message: 'Request timed out. Please try again.',
      });
    });
    
    // Prepare and send request
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.open('POST', url);
    xhr.send(formData);
  });
}
