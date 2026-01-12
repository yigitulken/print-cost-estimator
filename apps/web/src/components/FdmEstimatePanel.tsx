import { useState, useEffect, useCallback } from 'react';
import type { EstimateResponse, FdmProfile, SupportLevel } from '@print-cost/shared';
import './FdmEstimatePanel.css';

interface FdmEstimatePanelProps {
  analysisId: string;
}

type QualityChoice = 'draft' | 'standard' | 'quality';
type StrengthChoice = 'light' | 'standard' | 'strong';
type SupportChoice = 'off' | 'on';

const formatTRY = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

// Mapping function: customer choices → FdmProfile
function mapToProfile(
  quality: QualityChoice,
  strength: StrengthChoice,
  support: SupportChoice,
  vaseMode: boolean
): Partial<FdmProfile> {
  // Shared base defaults
  const base: Partial<FdmProfile> = {
    line_width_mm: 0.45,
    density_g_per_cm3: 1.24,
    waste_percent: 0.10,
  };

  // Quality mapping
  const qualityMap: Record<QualityChoice, { layer_height_mm: number; flow_mm3_per_s: number }> = {
    draft: { layer_height_mm: 0.28, flow_mm3_per_s: 12 },
    standard: { layer_height_mm: 0.20, flow_mm3_per_s: 10 },
    quality: { layer_height_mm: 0.12, flow_mm3_per_s: 7 },
  };

  // Strength mapping (only used if vaseMode is OFF)
  const strengthMap: Record<StrengthChoice, { wall_count: number; infill_percent: number; top_layers: number; bottom_layers: number }> = {
    light: { wall_count: 2, infill_percent: 8, top_layers: 3, bottom_layers: 3 },
    standard: { wall_count: 3, infill_percent: 15, top_layers: 4, bottom_layers: 4 },
    strong: { wall_count: 4, infill_percent: 25, top_layers: 5, bottom_layers: 5 },
  };

  // Support mapping
  const supportLevel: SupportLevel = support === 'on' ? 'normal' : 'none';

  if (vaseMode) {
    // Vase mode forces specific settings
    return {
      ...base,
      ...qualityMap[quality],
      wall_count: 1,
      infill_percent: 0,
      top_layers: 0,
      bottom_layers: 4,
      support_level: 'none', // force off
    };
  } else {
    // Normal mode
    return {
      ...base,
      ...qualityMap[quality],
      ...strengthMap[strength],
      support_level: supportLevel,
    };
  }
}

export function FdmEstimatePanel({ analysisId }: FdmEstimatePanelProps) {
  const [quality, setQuality] = useState<QualityChoice>('standard');
  const [strength, setStrength] = useState<StrengthChoice>('standard');
  const [support, setSupport] = useState<SupportChoice>('off');
  const [vaseMode, setVaseMode] = useState(false);

  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute profile from customer choices
  const profile = mapToProfile(quality, strength, support, vaseMode);

  // Fetch estimate with debounce
  const fetchEstimate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          technology: 'fdm_pla',
          profile,
          pricing: {
            mode: 'cost_plus',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch estimate');
      }

      const data = await response.json();
      setEstimate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch estimate');
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, [analysisId, profile]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEstimate();
    }, 320);

    return () => clearTimeout(timer);
  }, [fetchEstimate]);

  return (
    <div className="fdm-estimate-panel">
      <div className="fdm-header">
        <h3>FDM (PLA) Fiyat Hesaplama</h3>
        <p className="fdm-subtitle">Fiyat; kalite, dayanıklılık ve destek ihtiyacına göre değişir.</p>
      </div>

      {/* Quality Selection */}
      <div className="fdm-section">
        <label className="fdm-label">Yüzey Kalitesi</label>
        <div className="fdm-button-group">
          <button
            className={`fdm-button ${quality === 'draft' ? 'active' : ''}`}
            onClick={() => setQuality('draft')}
          >
            Hızlı
          </button>
          <button
            className={`fdm-button ${quality === 'standard' ? 'active' : ''}`}
            onClick={() => setQuality('standard')}
          >
            Dengeli
          </button>
          <button
            className={`fdm-button ${quality === 'quality' ? 'active' : ''}`}
            onClick={() => setQuality('quality')}
          >
            Pürüzsüz
          </button>
        </div>
      </div>

      {/* Strength Selection */}
      <div className="fdm-section">
        <label className="fdm-label">Dayanıklılık</label>
        <div className="fdm-button-group">
          <button
            className={`fdm-button ${strength === 'light' ? 'active' : ''}`}
            onClick={() => setStrength('light')}
            disabled={vaseMode}
          >
            Hafif
          </button>
          <button
            className={`fdm-button ${strength === 'standard' ? 'active' : ''}`}
            onClick={() => setStrength('standard')}
            disabled={vaseMode}
          >
            Normal
          </button>
          <button
            className={`fdm-button ${strength === 'strong' ? 'active' : ''}`}
            onClick={() => setStrength('strong')}
            disabled={vaseMode}
          >
            Güçlü
          </button>
        </div>
      </div>

      {/* Support Selection */}
      <div className="fdm-section">
        <label className="fdm-label">Destek Yapıları</label>
        <div className="fdm-button-group">
          <button
            className={`fdm-button ${support === 'off' ? 'active' : ''}`}
            onClick={() => setSupport('off')}
          >
            Gerekmez
          </button>
          <button
            className={`fdm-button ${support === 'on' ? 'active' : ''}`}
            onClick={() => setSupport('on')}
          >
            Gerekebilir
          </button>
        </div>
      </div>

      {/* Advanced: Vase Mode */}
      <details className="fdm-details">
        <summary className="fdm-summary">Gelişmiş Ayarlar</summary>
        <div className="fdm-advanced">
          <div className="fdm-vase-toggle">
            <label>
              <input
                type="checkbox"
                checked={vaseMode}
                onChange={e => setVaseMode(e.target.checked)}
              />
              <span>Vase Mode (Dekoratif / içi boş)</span>
            </label>
          </div>
        </div>
      </details>

      {/* Loading */}
      {loading && (
        <div className="fdm-loading">
          <div className="fdm-spinner"></div>
          <span>Hesaplanıyor...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fdm-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Results */}
      {estimate && !loading && (
        <div className="fdm-results">
          <div className="fdm-price-display">
            <span className="fdm-price-label">Tahmini Fiyat</span>
            <span className="fdm-price-value">{formatTRY.format(estimate.price_try)}</span>
          </div>

          <div className="fdm-stats">
            <div className="fdm-stat">
              <span className="fdm-stat-label">Tahmini Malzeme</span>
              <span className="fdm-stat-value">
                {estimate.estimate.material_g < 1000
                  ? `${estimate.estimate.material_g.toFixed(1)} g`
                  : `${estimate.estimate.material_kg.toFixed(3)} kg`}
              </span>
            </div>

            <div className="fdm-stat">
              <span className="fdm-stat-label">Tahmini Süre</span>
              <span className="fdm-stat-value">
                {estimate.estimate.time_h < 1
                  ? `${Math.round(estimate.estimate.time_h * 60)} dk`
                  : `${estimate.estimate.time_h.toFixed(2)} sa`}
              </span>
            </div>

            <div className="fdm-stat">
              <span className="fdm-stat-label">Kullanılan Hacim</span>
              <span className="fdm-stat-value">{estimate.estimate.used_volume_cm3.toFixed(2)} cm³</span>
            </div>
          </div>

          <details className="fdm-details">
            <summary className="fdm-summary">Detaylı Hesaplama</summary>
            <div className="fdm-breakdown">
              <div className="fdm-breakdown-row">
                <span>Duvar</span>
                <span>{(estimate.estimate.breakdown.shell_mm3 / 1000).toFixed(2)} cm³</span>
              </div>
              <div className="fdm-breakdown-row">
                <span>Dolgu</span>
                <span>{(estimate.estimate.breakdown.infill_mm3 / 1000).toFixed(2)} cm³</span>
              </div>
              <div className="fdm-breakdown-row">
                <span>Üst/Alt</span>
                <span>{(estimate.estimate.breakdown.top_bottom_extra_mm3 / 1000).toFixed(2)} cm³</span>
              </div>
              <div className="fdm-breakdown-row">
                <span>Destek</span>
                <span>{(estimate.estimate.breakdown.support_mm3 / 1000).toFixed(2)} cm³</span>
              </div>
              <div className="fdm-breakdown-row">
                <span>Fire Katsayısı</span>
                <span>{estimate.estimate.breakdown.waste_multiplier.toFixed(2)}x</span>
              </div>
              <div className="fdm-breakdown-row">
                <span>Karmaşıklık Katsayısı</span>
                <span>{estimate.estimate.breakdown.overhead_multiplier.toFixed(2)}x</span>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
