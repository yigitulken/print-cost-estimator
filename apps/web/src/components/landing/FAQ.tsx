export function FAQ() {
  const faqs = [
    {
      question: 'Gerçek fiyat mı?',
      answer: 'Hayır. Bu bir tahmindir.',
    },
    {
      question: 'STEP destekliyor musunuz?',
      answer: 'Şimdilik yalnızca STL.',
    },
    {
      question: 'Kargo / teslimat var mı?',
      answer: 'Prototipte yok.',
    },
    {
      question: 'Dosyam güvende mi?',
      answer: 'Dosya yalnızca analiz için kullanılır.',
    },
  ];

  return (
    <section id="sss" className="faq-section">
      <div className="container">
        <h2 className="faq-title">Sıkça Sorulan Sorular</h2>
        
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h4 className="faq-question">{faq.question}</h4>
              <p className="faq-answer">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

