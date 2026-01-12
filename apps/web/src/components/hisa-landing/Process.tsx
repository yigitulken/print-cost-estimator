export function Process() {
  const steps = [
    {
      number: '01',
      title: 'Dosya Gönderin',
      description: 'STL, STEP, fotoğraf veya teknik çizim',
    },
    {
      number: '02',
      title: 'Teklif Alın',
      description: '2 saat içinde detaylı fiyat ve süre',
    },
    {
      number: '03',
      title: 'Onaylayın',
      description: 'Malzeme ve teslimat seçeneklerini belirleyin',
    },
    {
      number: '04',
      title: 'Teslim Alın',
      description: 'Kapınıza özenle paketlenmiş şekilde',
    },
  ];

  return (
    <section className="hisa-process">
      <div className="hisa-container">
        <h2 className="hisa-section-title hisa-section-title--light">Nasıl Çalışıyor?</h2>
        <p className="hisa-section-subtitle hisa-section-subtitle--light">
          4 basit adımda ürününüz elinizde
        </p>

        <div className="hisa-process__timeline">
          {steps.map((step, index) => (
            <div key={step.number} className="hisa-process-step">
              <div className="hisa-process-step__number">{step.number}</div>
              <div className="hisa-process-step__content">
                <h3 className="hisa-process-step__title">{step.title}</h3>
                <p className="hisa-process-step__description">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hisa-process-step__arrow" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
