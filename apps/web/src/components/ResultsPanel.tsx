import type { AnalysisResult } from '@print-cost/shared';
import { formatBytes } from '../utils/formatBytes';
import { FdmEstimatePanel } from './FdmEstimatePanel';
import './ResultsPanel.css';

interface ResultsPanelProps {
  result: AnalysisResult;
  onReset: () => void;
}

const formatTRY = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

const priceLabels: Record<string, { name: string; description: string; accent: string }> = {
  fdm_pla: {
    name: 'FDM (PLA)',
    description: 'Most affordable, good for prototypes',
    accent: 'var(--color-accent-lime)',
  },
  sla_resin: {
    name: 'SLA (Resin)',
    description: 'High detail, smooth surface finish',
    accent: 'var(--color-accent-cyan)',
  },
  sls_pa12: {
    name: 'SLS (PA12)',
    description: 'Strong, functional parts, no supports',
    accent: 'var(--color-accent-magenta)',
  },
};

export function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  const { volume_cm3, bounding_box_mm, prices_try, meta } = result;

  return (
    <div className="results-panel">
      <div className="results-header">
        <h2>Analysis Complete</h2>
        <p className="file-name">{meta.file_name}</p>
      </div>

      <div className="results-metrics">
        <div className="metric-card">
          <span className="metric-label">Volume</span>
          <span className="metric-value">{volume_cm3.toFixed(2)} cm³</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Dimensions</span>
          <span className="metric-value dimensions">
            {bounding_box_mm.x.toFixed(1)} × {bounding_box_mm.y.toFixed(1)} × {bounding_box_mm.z.toFixed(1)} mm
          </span>
        </div>
      </div>

      <div className="prices-section">
        <h3>Estimated Prices</h3>
        <div className="prices-list">
          {Object.entries(prices_try).map(([key, price]) => {
            const info = priceLabels[key];
            return (
              <div
                key={key}
                className="price-card"
                style={{ '--accent': info.accent } as React.CSSProperties}
              >
                <div className="price-header">
                  <span className="price-tech">{info.name}</span>
                  <span className="price-amount">{formatTRY.format(price)}</span>
                </div>
                <p className="price-description">{info.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="results-meta">
        <span>Parse: {meta.parse_ms}ms</span>
        <span>Compute: {meta.compute_ms}ms</span>
        <span>Size: {formatBytes(meta.file_size_bytes)}</span>
      </div>

      {result.analysis_id ? (
        <FdmEstimatePanel analysisId={result.analysis_id} />
      ) : (
        <div className="fdm-note">
          <p>💡 Advanced FDM estimation requires a newer API version. The basic pricing above is still valid.</p>
        </div>
      )}

      <button className="btn-secondary" onClick={onReset}>
        ← Analyze Another File
      </button>
    </div>
  );
}

