import { useState } from 'react';

export function Capabilities() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const technologies = [
    { id: 'fdm', label: 'FDM', color: '#3b82f6' },
    { id: 'sla', label: 'SLA', color: '#8b5cf6' },
    { id: 'sls', label: 'SLS', color: '#ec4899' },
  ];

  const materials = [
    { id: 'pla', label: 'PLA' },
    { id: 'petg', label: 'PETG' },
    { id: 'abs', label: 'ABS' },
    { id: 'nylon', label: 'Nylon' },
    { id: 'tpu', label: 'TPU' },
    { id: 'carbon', label: 'Carbon Fiber' },
    { id: 'pc', label: 'Polikarbonat' },
    { id: 'asa', label: 'ASA' },
  ];

  const accordionItems = [
    {
      id: 'fdm-details',
      title: 'FDM (Fused Deposition Modeling)',
      content: 'En yaygın 3D baskı teknolojisi. Ekonomik ve hızlı üretim. Fonksiyonel prototipler ve son kullanım parçaları için idealdir.',
    },
    {
      id: 'sla-details',
      title: 'SLA (Stereolithography)',
      content: 'Reçine bazlı yüksek çözünürlük baskı. Pürüzsüz yüzeyler ve ince detaylar için mükemmel. Prototip ve kalıp üretimi.',
    },
    {
      id: 'materials',
      title: 'Malzeme Seçenekleri',
      content: 'Mekanik dayanıklılıktan esnekliğe, ısı direncinden kimyasal dirence kadar geniş yelpaze. Her uygulama için uygun malzeme.',
    },
    {
      id: 'tolerances',
      title: 'Toleranslar & Kalite',
      content: '±0.2mm standart tolerans, istek üzerine ±0.1mm hassasiyet. ISO 9001 kalite standartlarında üretim.',
    },
    {
      id: 'finishing',
      title: 'Son İşlemler',
      content: 'Zımparalama, boyama, kaplama, montaj ve daha fazlası. Ürününüz kullanıma hazır şekilde teslim edilir.',
    },
  ];

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <section className="hisa-capabilities">
      <div className="hisa-container">
        <h2 className="hisa-section-title">Teknik Yetenekler</h2>
        <p className="hisa-section-subtitle">
          Endüstriyel kalite standartlarında üretim
        </p>

        <div className="hisa-capabilities__badges">
          <div className="hisa-capabilities__badge-group">
            <div className="hisa-capabilities__badge-label">Teknolojiler</div>
            <div className="hisa-capabilities__badge-list">
              {technologies.map((tech) => (
                <span
                  key={tech.id}
                  className="hisa-chip"
                  style={{ borderColor: tech.color, color: tech.color }}
                >
                  {tech.label}
                </span>
              ))}
            </div>
          </div>

          <div className="hisa-capabilities__badge-group">
            <div className="hisa-capabilities__badge-label">Malzemeler</div>
            <div className="hisa-capabilities__badge-list">
              {materials.map((material) => (
                <span key={material.id} className="hisa-chip">
                  {material.label}
                </span>
              ))}
              <span className="hisa-chip hisa-chip--more">+7 daha</span>
            </div>
          </div>
        </div>

        <div className="hisa-capabilities__accordion">
          {accordionItems.map((item) => (
            <div
              key={item.id}
              className={`hisa-accordion-item ${openAccordion === item.id ? 'hisa-accordion-item--open' : ''}`}
            >
              <button
                type="button"
                className="hisa-accordion-item__trigger"
                onClick={() => toggleAccordion(item.id)}
                aria-expanded={openAccordion === item.id}
              >
                <span className="hisa-accordion-item__title">{item.title}</span>
                <svg
                  className="hisa-accordion-item__icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openAccordion === item.id && (
                <div className="hisa-accordion-item__content">
                  <p>{item.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
