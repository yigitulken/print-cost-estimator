export function SocialProof() {
  const metrics = [
    { value: '100+', label: 'Tamamlanan Proje' },
    { value: '45+', label: 'Mutlu Müşteri' },
    { value: '48sa', label: 'Ort. Teslimat' },
    { value: '%98', label: 'Müşteri Memnuniyeti' },
  ];

  const testimonials = [
    {
      id: 1,
      company: 'ABC Makine Ltd.',
      industry: 'Otomotiv',
      text: 'Üretimi durmuş bir parçayı 48 saat içinde aldık. Kalite mükemmel, fiyat çok uygun. Kesinlikle tavsiye ederim.',
      author: 'Mehmet Y.',
      role: 'Üretim Müdürü',
    },
    {
      id: 2,
      company: 'XYZ Elektronik',
      industry: 'Elektronik',
      text: 'Jig tasarımından üretime kadar tüm süreçte yanımızda oldular. Montaj hızımızı 3 katına çıkardık.',
      author: 'Ayşe K.',
      role: 'Proses Mühendisi',
    },
    {
      id: 3,
      company: 'Yenilikçi Teknoloji A.Ş.',
      industry: 'Sağlık',
      text: 'Prototip aşamasında çok hızlı iterasyon yapabildik. Fikrimizi hızlıca test etmemizi sağladılar.',
      author: 'Dr. Can M.',
      role: 'Kurucu Ortak',
    },
  ];

  return (
    <section className="hisa-social-proof">
      <div className="hisa-container">
        {/* Metrics */}
        <div className="hisa-metrics">
          {metrics.map((metric) => (
            <div key={metric.label} className="hisa-metric">
              <div className="hisa-metric__value">{metric.value}</div>
              <div className="hisa-metric__label">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="hisa-testimonials">
          <h2 className="hisa-section-title">Müşterilerimiz Ne Diyor?</h2>
          <div className="hisa-testimonials__grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="hisa-testimonial">
                <div className="hisa-testimonial__content">
                  <div className="hisa-testimonial__quote">"</div>
                  <p className="hisa-testimonial__text">{testimonial.text}</p>
                </div>
                <div className="hisa-testimonial__footer">
                  <div className="hisa-testimonial__author">
                    <div className="hisa-testimonial__name">{testimonial.author}</div>
                    <div className="hisa-testimonial__role">{testimonial.role}</div>
                  </div>
                  <div className="hisa-testimonial__company">
                    <div className="hisa-testimonial__company-name">{testimonial.company}</div>
                    <div className="hisa-testimonial__industry">{testimonial.industry}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NDA Banner */}
        <div className="hisa-nda-banner">
          <div className="hisa-nda-banner__icon">🔒</div>
          <div className="hisa-nda-banner__content">
            <h3 className="hisa-nda-banner__title">Gizlilik Güvencesi</h3>
            <p className="hisa-nda-banner__text">
              Tüm projeleriniz için NDA imzalıyoruz. Fikri mülkiyet haklarınız tamamen güvende.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
