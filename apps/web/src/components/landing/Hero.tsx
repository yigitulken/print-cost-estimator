import { RefObject } from 'react';
import { UploadCard } from './UploadCard';

type AppState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

interface ErrorState {
  code: string;
  message: string;
}

interface HeroProps {
  uploadRef: RefObject<HTMLDivElement>;
  state: AppState;
  error: ErrorState | null;
  showWarning: boolean;
  uploadProgress: number;
  onFileSelect: (file: File) => void;
  onValidationError: (error: ErrorState) => void;
  onScrollToUpload: () => void;
}

export function Hero({ 
  uploadRef, 
  state, 
  error, 
  showWarning,
  uploadProgress,
  onFileSelect,
  onValidationError,
  onScrollToUpload
}: HeroProps) {
  const scrollToHowItWorks = () => {
    document.getElementById('nasil-calisir')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="landing-hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-eyebrow">STL • max 400MB • Estimated</span>
            <h1 className="hero-title">
              STL yükle, anında ₺ tahmini baskı ücretini gör.
            </h1>
            <p className="hero-subtitle">
              Basit 3D önizleme + FDM / SLA / SLS için otomatik fiyat tahmini.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary" onClick={onScrollToUpload}>
                STL Yükle
              </button>
              <button className="hero-btn-secondary" onClick={scrollToHowItWorks}>
                Nasıl çalışır?
              </button>
            </div>
            <p className="hero-microcopy">
              Fiyatlar otomatik tahmindir (Estimated).
            </p>
          </div>
          
          <div className="upload-card-wrapper" ref={uploadRef}>
            <UploadCard
              state={state}
              error={error}
              showWarning={showWarning}
              uploadProgress={uploadProgress}
              onFileSelect={onFileSelect}
              onValidationError={onValidationError}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

