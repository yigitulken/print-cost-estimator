interface HeroProps {
  onCtaClick: () => void;
  onPortfolioClick: () => void;
}

export function Hero({ onCtaClick, onPortfolioClick }: HeroProps) {
  return (
    <section className="hisa-hero">
      <div className="hisa-container">
        <div className="hisa-hero__content">
          <div className="hisa-hero__text">
            <div className="hisa-hero__eyebrow">Endüstriyel 3D Baskı Çözümleri</div>
            
            <h1 className="hisa-hero__title">
              Üretim Sürecinizi Hızlandırın, Maliyetlerinizi Düşürün
            </h1>

            <p className="hisa-hero__subtitle">
              Yedek parça üretiminden prototiplemeye, ekipman tasarımından jig & fixture üretimine kadar tüm 3D baskı ihtiyaçlarınız için profesyonel çözümler.
            </p>

            <div className="hisa-hero__trust">
              <div className="hisa-hero__trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>48 saat teslimat</span>
              </div>
              <div className="hisa-hero__trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Ücretsiz tasarım desteği</span>
              </div>
              <div className="hisa-hero__trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>100+ tamamlanmış proje</span>
              </div>
            </div>

            <div className="hisa-hero__actions">
              <button
                type="button"
                className="hisa-btn hisa-btn--primary hisa-btn--large"
                onClick={onCtaClick}
              >
                Hemen Teklif Al
              </button>
              
              <button
                type="button"
                className="hisa-hero__link"
                onClick={onPortfolioClick}
              >
                Portföyü Görüntüle →
              </button>
            </div>

            <p className="hisa-hero__microcopy">
              💡 Dosya yoksa da olur—fotoğrafla başlayabilirsiniz.
            </p>
          </div>

          <div className="hisa-hero__visual">
            <div className="hisa-hero__card">
              <div className="hisa-hero__card-glow"></div>
              <div className="hisa-hero__card-content">
                <div className="hisa-hero__card-icon">🏭</div>
                <div className="hisa-hero__card-text">
                  <div className="hisa-hero__card-title">Profesyonel Üretim</div>
                  <div className="hisa-hero__card-subtitle">Endüstriyel kalite, hızlı teslimat</div>
                </div>
                <div className="hisa-hero__card-stats">
                  <div className="hisa-hero__stat">
                    <div className="hisa-hero__stat-value">48sa</div>
                    <div className="hisa-hero__stat-label">Teslimat</div>
                  </div>
                  <div className="hisa-hero__stat">
                    <div className="hisa-hero__stat-value">15+</div>
                    <div className="hisa-hero__stat-label">Malzeme</div>
                  </div>
                  <div className="hisa-hero__stat">
                    <div className="hisa-hero__stat-value">100+</div>
                    <div className="hisa-hero__stat-label">Proje</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
