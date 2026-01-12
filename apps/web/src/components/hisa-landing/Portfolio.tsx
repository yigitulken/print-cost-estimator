import { useState } from 'react';

interface PortfolioProps {
  onCaseSelect: (caseId: string) => void;
}

interface CaseModalProps {
  caseData: PortfolioCase | null;
  onClose: () => void;
  onCtaClick: (caseId: string) => void;
}

interface PortfolioCase {
  id: string;
  title: string;
  category: string;
  industry: string;
  image: string;
  challenge: string;
  solution: string;
  results: string[];
  specs: {
    technology: string;
    material: string;
    deliveryTime: string;
  };
}

export function Portfolio({ onCaseSelect }: PortfolioProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<PortfolioCase | null>(null);

  const filters = [
    { id: 'all', label: 'Tümü' },
    { id: 'obsolescence', label: 'Yedek Parça' },
    { id: 'jig-fixture', label: 'Jig & Fixture' },
    { id: 'prototype', label: 'Prototip' },
  ];

  const cases: PortfolioCase[] = [
    {
      id: 'case-1',
      title: 'CNC Tezgahı Yedek Parça',
      category: 'obsolescence',
      industry: 'Otomotiv',
      image: '🔩',
      challenge: 'Üretimi durmuş bir CNC tezgahı için kritik plastik parça. Orijinal tedarikçi artık üretmiyor.',
      solution: 'Mevcut parçadan 3D tarama yaparak dijital model oluşturduk. ASA malzeme ile endüstriyel dayanıklılıkta ürettik.',
      results: ['2 gün teslimat', '₺2.400 tasarruf', '5 yıl garanti'],
      specs: {
        technology: 'FDM',
        material: 'ASA',
        deliveryTime: '48 saat',
      },
    },
    {
      id: 'case-2',
      title: 'Üretim Hattı Montaj Kalıbı',
      category: 'jig-fixture',
      industry: 'Elektronik',
      image: '🔧',
      challenge: 'PCB montaj hattı için özel kalıp. Geleneksel üretim 3 hafta sürüyor ve maliyetli.',
      solution: 'Özel tasarım jig, operatörün montaj hızını 3 kat artırdı. Nylon malzeme ile tekrar kullanıma uygun.',
      results: ['70% maliyet tasarrufu', '3x hız artışı', 'Ergonomik tasarım'],
      specs: {
        technology: 'FDM',
        material: 'Nylon PA12',
        deliveryTime: '3 gün',
      },
    },
    {
      id: 'case-3',
      title: 'Medikal Cihaz Prototipi',
      category: 'prototype',
      industry: 'Sağlık',
      image: '🧪',
      challenge: 'Yeni medikal cihaz konsepti için fonksiyonel prototip. Yatırımcılara sunmak için gerçekçi model gerekiyor.',
      solution: 'SLA teknoloji ile detaylı, pürüzsüz yüzey kalitesinde prototip. 3 iterasyon ile nihai tasarıma ulaştık.',
      results: ['Yatırım alındı', '5 iterasyon', 'CE sertifikası yolu'],
      specs: {
        technology: 'SLA',
        material: 'Reçine',
        deliveryTime: '5 gün',
      },
    },
    {
      id: 'case-4',
      title: 'Özel Kablo Kanalı',
      category: 'jig-fixture',
      industry: 'Enerji',
      image: '⚡',
      challenge: 'Elektrik panolarında kablo düzenlemesi için özel kanal sistemi.',
      solution: 'Modüler tasarım ile farklı panel boyutlarına uyum. PETG ile UV ve kimyasal direnç.',
      results: ['Modüler sistem', '50 adet üretim', 'IP54 koruması'],
      specs: {
        technology: 'FDM',
        material: 'PETG',
        deliveryTime: '1 hafta',
      },
    },
    {
      id: 'case-5',
      title: 'Hidrolik Vana Kapağı',
      category: 'obsolescence',
      industry: 'Makine',
      image: '💧',
      challenge: 'Eski hidrolik sistemde kırılan plastik vana kapağı. Orijinal parça bulunamıyor.',
      solution: 'Reverse engineering ile tasarım. Polikarbonat ile yüksek basınca dayanıklı üretim.',
      results: ['1 gün teslimat', 'Basınç testi geçti', '₺3.200 tasarruf'],
      specs: {
        technology: 'FDM',
        material: 'Polikarbonat',
        deliveryTime: '24 saat',
      },
    },
    {
      id: 'case-6',
      title: 'Ürün Kavram Modeli',
      category: 'prototype',
      industry: 'Tüketici Ürünleri',
      image: '📦',
      challenge: 'Yeni ürün lansmanı için pazarlama fotoğrafları ve testler.',
      solution: 'Çok renkli, gerçekçi görünümlü model. Post-processing ile pürüzsüz yüzey.',
      results: ['Fuar gösterimi', 'Pazarlama görselleri', 'Kullanıcı testleri'],
      specs: {
        technology: 'FDM + SLA',
        material: 'PLA + Reçine',
        deliveryTime: '4 gün',
      },
    },
  ];

  const filteredCases = activeFilter === 'all' 
    ? cases 
    : cases.filter((c) => c.category === activeFilter);

  const handleCaseClick = (caseItem: PortfolioCase) => {
    setSelectedCase(caseItem);
  };

  const handleModalClose = () => {
    setSelectedCase(null);
  };

  const handleModalCta = (caseId: string) => {
    setSelectedCase(null);
    onCaseSelect(caseId);
  };

  return (
    <>
      <section className="hisa-portfolio" id="portfolio">
        <div className="hisa-container">
          <h2 className="hisa-section-title">Başarılı Projeler</h2>
          <p className="hisa-section-subtitle">
            Farklı sektörlerden gerçek çözümler
          </p>

          <div className="hisa-portfolio__filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`hisa-chip hisa-chip--filter ${activeFilter === filter.id ? 'hisa-chip--active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="hisa-portfolio__grid">
            {filteredCases.map((caseItem) => (
              <button
                key={caseItem.id}
                type="button"
                className="hisa-portfolio-card"
                onClick={() => handleCaseClick(caseItem)}
              >
                <div className="hisa-portfolio-card__image">
                  <span className="hisa-portfolio-card__emoji">{caseItem.image}</span>
                </div>
                <div className="hisa-portfolio-card__content">
                  <div className="hisa-portfolio-card__meta">
                    <span className="hisa-portfolio-card__category">{caseItem.industry}</span>
                  </div>
                  <h3 className="hisa-portfolio-card__title">{caseItem.title}</h3>
                  <p className="hisa-portfolio-card__excerpt">{caseItem.challenge}</p>
                  <div className="hisa-portfolio-card__cta">
                    Detayları Gör <span aria-hidden="true">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedCase && (
        <CaseModal
          caseData={selectedCase}
          onClose={handleModalClose}
          onCtaClick={handleModalCta}
        />
      )}
    </>
  );
}

function CaseModal({ caseData, onClose, onCtaClick }: CaseModalProps) {
  if (!caseData) return null;

  return (
    <div
      className="hisa-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="hisa-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="hisa-modal__close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="hisa-modal__content">
          <div className="hisa-modal__header">
            <div className="hisa-modal__icon">{caseData.image}</div>
            <div>
              <div className="hisa-modal__meta">
                <span className="hisa-chip">{caseData.industry}</span>
                <span className="hisa-chip">{caseData.specs.technology}</span>
              </div>
              <h2 id="modal-title" className="hisa-modal__title">{caseData.title}</h2>
            </div>
          </div>

          <div className="hisa-modal__section">
            <h3 className="hisa-modal__section-title">Zorluk</h3>
            <p>{caseData.challenge}</p>
          </div>

          <div className="hisa-modal__section">
            <h3 className="hisa-modal__section-title">Çözüm</h3>
            <p>{caseData.solution}</p>
          </div>

          <div className="hisa-modal__section">
            <h3 className="hisa-modal__section-title">Sonuçlar</h3>
            <ul className="hisa-modal__results">
              {caseData.results.map((result, idx) => (
                <li key={idx}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {result}
                </li>
              ))}
            </ul>
          </div>

          <div className="hisa-modal__specs">
            <div className="hisa-modal__spec">
              <div className="hisa-modal__spec-label">Teknoloji</div>
              <div className="hisa-modal__spec-value">{caseData.specs.technology}</div>
            </div>
            <div className="hisa-modal__spec">
              <div className="hisa-modal__spec-label">Malzeme</div>
              <div className="hisa-modal__spec-value">{caseData.specs.material}</div>
            </div>
            <div className="hisa-modal__spec">
              <div className="hisa-modal__spec-label">Teslimat</div>
              <div className="hisa-modal__spec-value">{caseData.specs.deliveryTime}</div>
            </div>
          </div>

          <button
            type="button"
            className="hisa-modal__cta"
            onClick={() => onCtaClick(caseData.id)}
          >
            Benzer Proje İçin Teklif Al <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
