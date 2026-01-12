import { useState } from 'react';

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = [
    {
      id: 'q1',
      question: 'Hangi dosya formatlarını kabul ediyorsunuz?',
      answer: 'STL, STEP, IGES formatlarında 3D dosyalar kabul ediyoruz. Dosyanız yoksa fotoğraf, teknik çizim veya eskiz de gönderebilirsiniz—biz modelleriz.',
    },
    {
      id: 'q2',
      question: 'Teslimat süresi ne kadar?',
      answer: 'Standart teslimat 2-5 iş günüdür. Acil siparişler için 24-48 saat içinde teslimat yapabiliyoruz. Teklif aşamasında kesin süre belirtilir.',
    },
    {
      id: 'q3',
      question: 'Minimum sipariş miktarı var mı?',
      answer: 'Hayır, minimum sipariş miktarı yoktur. Tek parça bile üretim yapabiliyoruz. Yüksek adetlerde indirim uyguluyoruz.',
    },
    {
      id: 'q4',
      question: 'Fiyat nasıl hesaplanıyor?',
      answer: 'Fiyat; parça boyutu, malzeme, doluluk oranı, baskı süresi ve son işlemlere göre hesaplanır. Teklif formunu doldurduğunuzda 2 saat içinde detaylı fiyat alırsınız.',
    },
    {
      id: 'q5',
      question: 'Gizlilik sözleşmesi (NDA) imzalıyor musunuz?',
      answer: 'Evet, talep ettiğiniz takdirde tüm projeler için NDA imzalıyoruz. Fikri mülkiyet haklarınız tamamen güvence altındadır.',
    },
  ];

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="hisa-faq" id="faq">
      <div className="hisa-container">
        <h2 className="hisa-section-title">Sıkça Sorulan Sorular</h2>
        
        <div className="hisa-faq__list">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`hisa-faq-item ${openId === faq.id ? 'hisa-faq-item--open' : ''}`}
            >
              <button
                type="button"
                className="hisa-faq-item__trigger"
                onClick={() => toggle(faq.id)}
                aria-expanded={openId === faq.id}
              >
                <span className="hisa-faq-item__question">{faq.question}</span>
                <svg
                  className="hisa-faq-item__icon"
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
              {openId === faq.id && (
                <div className="hisa-faq-item__answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
