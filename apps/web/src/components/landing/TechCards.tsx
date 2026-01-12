export function TechCards() {
  const technologies = [
    {
      icon: '🛠️',
      title: 'FDM (PLA)',
      description: 'En ekonomik seçenek',
    },
    {
      icon: '✨',
      title: 'SLA (Standard Resin)',
      description: 'Daha pürüzsüz yüzey',
    },
    {
      icon: '🏭',
      title: 'SLS (PA12)',
      description: 'Daha dayanıklı, endüstriyel',
    },
  ];

  return (
    <section id="teknolojiler" className="tech-section">
      <div className="container">
        <h2 className="tech-section-title">Desteklenen Teknolojiler</h2>
        
        <div className="tech-cards-grid">
          {technologies.map((tech, index) => (
            <div key={index} className="tech-card">
              <div className="tech-card-icon">{tech.icon}</div>
              <h3 className="tech-card-title">{tech.title}</h3>
              <p className="tech-card-desc">{tech.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

