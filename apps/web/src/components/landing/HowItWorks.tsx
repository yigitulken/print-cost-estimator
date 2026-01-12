export function HowItWorks() {
  return (
    <section id="nasil-calisir" className="how-it-works">
      <div className="container">
        <div className="how-it-works-inner">
          <h2 className="how-it-works-title">Nasıl çalışır?</h2>
          
          <div className="steps-card">
            <div className="steps-list">
              <div className="step-item">
                <span className="step-number">1</span>
                <span className="step-text">STL'yi yükle</span>
              </div>
              
              <span className="step-arrow">→</span>
              
              <div className="step-item">
                <span className="step-number">2</span>
                <span className="step-text">Önizleme oluşsun</span>
              </div>
              
              <span className="step-arrow">→</span>
              
              <div className="step-item">
                <span className="step-number">3</span>
                <span className="step-text">₺ fiyatları gör (FDM / SLA / SLS)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

