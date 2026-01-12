interface ServicesProps {
  onServiceClick: (serviceType: string) => void;
}

export function Services({ onServiceClick }: ServicesProps) {
  const services = [
    {
      id: 'design-only',
      icon: '✏️',
      title: 'Tasarım Hizmeti',
      description: 'Fikrinizi 3D modele dönüştürün. Teknik resimlerden veya fotoğraflardan profesyonel CAD modelleme.',
      features: ['Teknik çizim', 'Revizyon desteği', 'Üretilebilirlik analizi'],
    },
    {
      id: 'print-only',
      icon: '🖨️',
      title: 'Sadece Baskı',
      description: 'Hazır STL/STEP dosyanızı yüksek kalitede basıyoruz. 15+ malzeme seçeneği, hızlı teslimat.',
      features: ['FDM / SLA teknolojileri', 'Geniş malzeme yelpazesi', '48 saat teslimat'],
    },
    {
      id: 'design-print',
      icon: '🚀',
      title: 'Tasarım + Baskı',
      description: 'Baştan sona eksiksiz hizmet. Konseptten üretime, tüm süreçte yanınızdayız.',
      features: ['Tam entegre süreç', 'Prototip iterasyonu', 'Kalite güvencesi'],
    },
  ];

  return (
    <section className="hisa-services" id="services">
      <div className="hisa-container">
        <h2 className="hisa-section-title">Hizmetlerimiz</h2>
        <p className="hisa-section-subtitle">
          İhtiyacınıza uygun hizmeti seçin
        </p>

        <div className="hisa-services__grid">
          {services.map((service) => (
            <div key={service.id} className="hisa-service-card">
              <div className="hisa-service-card__icon">{service.icon}</div>
              <h3 className="hisa-service-card__title">{service.title}</h3>
              <p className="hisa-service-card__description">{service.description}</p>
              
              <ul className="hisa-service-card__features">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="hisa-service-card__feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="hisa-service-card__link"
                onClick={() => onServiceClick(service.id)}
              >
                Teklif Al <span aria-hidden="true">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
