interface UseCasesProps {
  onCaseClick: (useCase: string, serviceType: string) => void;
}

export function UseCases({ onCaseClick }: UseCasesProps) {
  const cases = [
    {
      id: 'obsolescence',
      icon: '⚙️',
      title: 'Yedek Parça Üretimi',
      description: 'Üretimi durmuş parçaları hızlıca üretin, üretim hattınızı durdurmayın.',
      useCase: 'obsolescence',
      serviceType: 'print-only',
    },
    {
      id: 'jig-fixture',
      icon: '🔧',
      title: 'Jig & Fixture',
      description: 'Özel ekipman ve kalıplar, montaj aparatları ve üretim yardımcıları.',
      useCase: 'jig-fixture',
      serviceType: 'design-print',
    },
    {
      id: 'prototype',
      icon: '🧪',
      title: 'Prototip Geliştirme',
      description: 'Fikrinizi hızlıca test edin, iterasyon maliyetlerini minimize edin.',
      useCase: 'prototype',
      serviceType: 'design-print',
    },
  ];

  return (
    <section className="hisa-use-cases" id="use-cases">
      <div className="hisa-container">
        <h2 className="hisa-section-title">Hangi İhtiyacınız Var?</h2>
        <p className="hisa-section-subtitle">
          İhtiyacınıza özel çözümle hızlı başlayın
        </p>

        <div className="hisa-use-cases__grid">
          {cases.map((item) => (
            <button
              key={item.id}
              type="button"
              className="hisa-use-case"
              onClick={() => onCaseClick(item.useCase, item.serviceType)}
            >
              <div className="hisa-use-case__icon">{item.icon}</div>
              <h3 className="hisa-use-case__title">{item.title}</h3>
              <p className="hisa-use-case__description">{item.description}</p>
              <div className="hisa-use-case__cta">
                Teklif Al <span aria-hidden="true">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
