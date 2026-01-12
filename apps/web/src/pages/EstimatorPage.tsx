import { useState, useCallback, useRef } from 'react';
import type { AnalysisResult } from '@print-cost/shared';
import { WARNING_FILE_SIZE_BYTES, MAX_FILE_SIZE_BYTES, LEGACY_MAX_FILE_SIZE_BYTES } from '@print-cost/shared';
import { STLViewer } from '../components/STLViewer';
import { ResultsPanel } from '../components/ResultsPanel';
import { UploadCard } from '../components/landing';
import { Header, Footer } from '../components/hisa-landing';
import { uploadWithProgress } from '../utils/uploadWithProgress';
import { analyzeViaMultipart } from '../utils/multipartUpload';
import './EstimatorPage.css';

type AppState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

interface ErrorState {
  code: string;
  message: string;
}

export function EstimatorPage() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    // Reset state
    setError(null);
    setResult(null);
    setShowWarning(false);
    setUploadProgress(0);

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError({
        code: 'file_too_large',
        message: 'File too large. Max size is 400MB.',
      });
      setState('error');
      return;
    }

    if (file.size >= WARNING_FILE_SIZE_BYTES) {
      setShowWarning(true);
    }

    setStlFile(file);
    setState('uploading');

    try {
      let data: AnalysisResult;

      // Use multipart upload for files > 25MB, or try multipart first and fallback to legacy
      if (file.size > LEGACY_MAX_FILE_SIZE_BYTES) {
        // Must use multipart for large files
        data = await analyzeViaMultipart(file, (event) => {
          setUploadProgress(event.percentage);
          if (event.phase === 'analyzing') {
            setState('analyzing');
          }
        });
      } else {
        // Try multipart first, fallback to legacy if R2 not configured
        try {
          data = await analyzeViaMultipart(file, (event) => {
            setUploadProgress(event.percentage);
            if (event.phase === 'analyzing') {
              setState('analyzing');
            }
          });
        } catch (err: unknown) {
          // If R2 not configured, fallback to legacy endpoint
          if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'service_unavailable') {
            data = await uploadWithProgress({
              url: '/api/analyze',
              file,
              onProgress: (event) => {
                setUploadProgress(event.percentage);
                if (event.percentage >= 100) {
                  setState('analyzing');
                }
              },
            });
          } else {
            throw err;
          }
        }
      }

      setResult(data);
      setState('success');
      
      // Scroll to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      // Handle structured errors
      if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
        setError({
          code: (err as { code: string }).code,
          message: (err as { message: string }).message,
        });
      } else {
        setError({
          code: 'unknown_error',
          message: 'Something went wrong. Please try again.',
        });
      }
      setState('error');
    }
  }, []);

  const handleValidationError = useCallback((validationError: ErrorState) => {
    setError(validationError);
    setState('error');
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setStlFile(null);
    setShowWarning(false);
    setUploadProgress(0);
    scrollToUpload();
  }, [scrollToUpload]);

  return (
    <div className="estimator-page hisa-landing">
      <Header onCtaClick={scrollToUpload} />
      
      {/* Hero/Upload Section */}
      <section className="estimator-hero">
        <div className="hisa-container">
          <div className="estimator-hero__content">
            <div className="estimator-hero__text">
              <div className="estimator-hero__eyebrow">STL Fiyat Hesaplayıcı</div>
              <h1 className="estimator-hero__title">
                3D Baskı Maliyetinizi Anında Hesaplayın
              </h1>
              <p className="estimator-hero__subtitle">
                STL dosyanızı yükleyin, hacim ve boyut analizi ile birlikte FDM, SLA ve SLS teknolojileri için fiyat tahmini alın.
              </p>
            </div>
            <div className="estimator-hero__upload" ref={uploadRef}>
              <UploadCard
                state={state}
                error={error}
                showWarning={showWarning}
                uploadProgress={uploadProgress}
                onFileSelect={handleFileSelect}
                onValidationError={handleValidationError}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section - shown after successful analysis */}
      {state === 'success' && result && stlFile && (
        <section className="results-section-landing" ref={resultsRef}>
          <div className="hisa-container">
            <div className="results-layout-landing">
              {showWarning && (
                <div className="warning-banner-landing">
                  ⚠️ Large file — analysis may take longer.
                </div>
              )}
              <div className="viewer-section-landing">
                <STLViewer file={stlFile} />
              </div>
              <div className="results-panel-section">
                <ResultsPanel result={result} onReset={handleReset} />
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

