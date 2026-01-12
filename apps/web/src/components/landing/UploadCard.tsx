import { useCallback, useState, useRef } from 'react';

type AppState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

interface ErrorState {
  code: string;
  message: string;
}

interface UploadCardProps {
  state: AppState;
  error: ErrorState | null;
  showWarning: boolean;
  uploadProgress: number; // 0-100
  onFileSelect: (file: File) => void;
  onValidationError: (error: ErrorState) => void;
}

export function UploadCard({ state, error, showWarning, uploadProgress, onFileSelect, onValidationError }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    // Validate extension (.stl case-insensitive)
    if (!file.name.toLowerCase().endsWith('.stl')) {
      onValidationError({
        code: 'invalid_format',
        message: 'Unsupported file type. Please upload an STL file.',
      });
      return false;
    }
    return true;
  }, [onValidationError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  }, [onFileSelect, validateFile]);

  return (
    <div className="upload-card">
      <div className="upload-card-header">
        <h3 className="upload-card-title">STL Dosyası Yükle</h3>
        <p className="upload-card-subtitle">3D modelinizi analiz edin</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".stl"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {state === 'uploading' || state === 'analyzing' ? (
        <div className="upload-loading">
          {state === 'uploading' ? (
            <>
              <div className="upload-progress-container">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="upload-loading-text">Uploading… {Math.round(uploadProgress)}%</p>
            </>
          ) : (
            <>
              <div className="upload-spinner" />
              <p className="upload-loading-text">Analyzing geometry…</p>
            </>
          )}
        </div>
      ) : (
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <svg className="upload-dropzone-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L4 16V32L24 44L44 32V16L24 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M4 16L24 28M24 28L44 16M24 28V44" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M24 12L32 17V27L24 32L16 27V17L24 12Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          
          <div className="upload-dropzone-text">
            <strong>STL dosyanızı sürükleyin</strong>
            <span>veya tıklayarak seçin</span>
          </div>
        </div>
      )}

      <div className="upload-badges">
        <span className="upload-badge">Yalnızca STL</span>
        <span className="upload-badge">Max 400MB</span>
      </div>

      {showWarning && state !== 'error' && (
        <div className="upload-warning">
          ⚠️ Large file — analysis may take longer.
        </div>
      )}

      {error && (
        <div className="upload-error">
          ✕ {error.message}
        </div>
      )}
    </div>
  );
}

