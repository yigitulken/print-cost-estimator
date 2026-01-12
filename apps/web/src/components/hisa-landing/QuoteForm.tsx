import { useState, useRef, FormEvent, ChangeEvent } from 'react';

interface QuoteFormProps {
  prefillData?: {
    serviceType?: string;
    useCase?: string;
    caseId?: string;
  };
}

interface FormData {
  // Step 1
  serviceType: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  // Step 2
  files: File[];
  material: string;
  quantity: string;
  deliveryExpectation: string;
  city: string;
  notes: string;
  kvkkConsent: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function QuoteForm({ prefillData }: QuoteFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    serviceType: prefillData?.serviceType || '',
    description: prefillData?.useCase ? `Kullanım alanı: ${prefillData.useCase}` : '',
    name: '',
    email: '',
    phone: '',
    files: [],
    material: '',
    quantity: '1',
    deliveryExpectation: '',
    city: '',
    notes: prefillData?.caseId ? `Referans: ${prefillData.caseId}` : '',
    kvkkConsent: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.serviceType) {
      newErrors.serviceType = 'Lütfen bir hizmet türü seçin';
    }
    if (formData.description.length < 20) {
      newErrors.description = 'Lütfen en az 20 karakter açıklama girin';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'İsim gerekli';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.deliveryExpectation) {
      newErrors.deliveryExpectation = 'Teslimat süresi seçin';
    }
    if (!formData.kvkkConsent) {
      newErrors.kvkkConsent = 'KVKK iznini onaylamanız gerekiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Check total size (200MB limit)
      const totalSize = filesArray.reduce((acc, file) => acc + file.size, 0);
      const maxSize = 200 * 1024 * 1024; // 200MB

      if (totalSize > maxSize) {
        setErrors((prev) => ({
          ...prev,
          files: 'Toplam dosya boyutu 200MB\'ı geçemez',
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...filesArray],
      }));

      if (errors.files) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.files;
          return newErrors;
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleMaterialSelect = (material: string) => {
    setFormData((prev) => ({
      ...prev,
      material,
    }));
  };

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      // Scroll to top of form
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Dispatch analytics event
      window.dispatchEvent(new CustomEvent('lp_form_step1_submit'));
    }
  };

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('serviceType', formData.serviceType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('material', formData.material);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('deliveryExpectation', formData.deliveryExpectation);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('notes', formData.notes);
      if (prefillData?.useCase) {
        formDataToSend.append('useCase', prefillData.useCase);
      }
      if (prefillData?.caseId) {
        formDataToSend.append('caseId', prefillData.caseId);
      }

      // Append files
      formData.files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('/api/quote', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Form gönderimi başarısız oldu');
      }

      const result = await response.json();
      console.log('Quote request submitted:', result);

      setSubmitSuccess(true);
      
      // Dispatch analytics event
      window.dispatchEvent(new CustomEvent('lp_form_submit_success'));

    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('Bir hata oluştu. Lütfen tekrar deneyin veya WhatsApp ile iletişime geçin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <section className="hisa-quote-form" id="quote-form">
        <div className="hisa-container">
          <div className="hisa-quote-form__success">
            <div className="hisa-quote-form__success-icon">✓</div>
            <h2 className="hisa-quote-form__success-title">Talebiniz Alındı!</h2>
            <p className="hisa-quote-form__success-text">
              Ekibimiz en kısa sürede size dönüş yapacaktır. Genellikle 2 saat içinde detaylı teklif gönderiyoruz.
            </p>
            <div className="hisa-quote-form__success-actions">
              <a
                href="https://wa.me/905XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="hisa-btn hisa-btn--ghost"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ile İletişime Geç
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hisa-quote-form" id="quote-form" ref={formRef}>
      <div className="hisa-container">
        <h2 className="hisa-section-title">Teklif Alın</h2>
        <p className="hisa-section-subtitle">
          2 dakikada form doldurun, 2 saatte teklif alın
        </p>

        <div className="hisa-quote-form__wrapper">
          <div className="hisa-quote-form__progress">
            <div className={`hisa-quote-form__step ${step >= 1 ? 'hisa-quote-form__step--active' : ''}`}>
              <div className="hisa-quote-form__step-number">1</div>
              <div className="hisa-quote-form__step-label">Temel Bilgiler</div>
            </div>
            <div className="hisa-quote-form__step-line"></div>
            <div className={`hisa-quote-form__step ${step >= 2 ? 'hisa-quote-form__step--active' : ''}`}>
              <div className="hisa-quote-form__step-number">2</div>
              <div className="hisa-quote-form__step-label">Detaylar</div>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="hisa-quote-form__form">
              <div className="hisa-form-group">
                <label htmlFor="serviceType" className="hisa-form-label">
                  Hizmet Türü <span className="hisa-form-required">*</span>
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className={`hisa-form-select ${errors.serviceType ? 'hisa-form-input--error' : ''}`}
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="design-only">Sadece Tasarım</option>
                  <option value="print-only">Sadece Baskı</option>
                  <option value="design-print">Tasarım + Baskı</option>
                </select>
                {errors.serviceType && <div className="hisa-form-error">{errors.serviceType}</div>}
              </div>

              <div className="hisa-form-group">
                <label htmlFor="description" className="hisa-form-label">
                  Proje Açıklaması <span className="hisa-form-required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Neye ihtiyacınız var? Ne için kullanılacak? Özel gereksinimler var mı?"
                  rows={4}
                  className={`hisa-form-textarea ${errors.description ? 'hisa-form-input--error' : ''}`}
                  required
                />
                <div className="hisa-form-hint">Minimum 20 karakter</div>
                {errors.description && <div className="hisa-form-error">{errors.description}</div>}
              </div>

              <div className="hisa-form-row">
                <div className="hisa-form-group">
                  <label htmlFor="name" className="hisa-form-label">
                    Adınız Soyadınız <span className="hisa-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`hisa-form-input ${errors.name ? 'hisa-form-input--error' : ''}`}
                    required
                  />
                  {errors.name && <div className="hisa-form-error">{errors.name}</div>}
                </div>

                <div className="hisa-form-group">
                  <label htmlFor="email" className="hisa-form-label">
                    E-posta <span className="hisa-form-required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`hisa-form-input ${errors.email ? 'hisa-form-input--error' : ''}`}
                    required
                  />
                  {errors.email && <div className="hisa-form-error">{errors.email}</div>}
                </div>
              </div>

              <div className="hisa-form-group">
                <label htmlFor="phone" className="hisa-form-label">
                  Telefon <span className="hisa-form-required">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="05XX XXX XX XX"
                  className={`hisa-form-input ${errors.phone ? 'hisa-form-input--error' : ''}`}
                  required
                />
                {errors.phone && <div className="hisa-form-error">{errors.phone}</div>}
              </div>

              <button type="submit" className="hisa-btn hisa-btn--primary hisa-btn--large hisa-btn--full">
                Devam Et →
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="hisa-quote-form__form">
              <div className="hisa-form-group">
                <label className="hisa-form-label">Dosya Yükle</label>
                <div
                  className="hisa-file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <div className="hisa-file-dropzone__text">
                    <strong>Dosya seçin veya sürükleyin</strong>
                    <span>STL, STEP, IGES, ZIP, resim, PDF</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".stl,.step,.stp,.iges,.igs,.zip,.jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {formData.files.length > 0 && (
                  <div className="hisa-file-list">
                    {formData.files.map((file, index) => (
                      <div key={index} className="hisa-file-item">
                        <span className="hisa-file-item__name">{file.name}</span>
                        <span className="hisa-file-item__size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="hisa-file-item__remove"
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.files && <div className="hisa-form-error">{errors.files}</div>}
              </div>

              <div className="hisa-form-group">
                <label className="hisa-form-label">Malzeme Tercihi</label>
                <div className="hisa-material-chips">
                  {['PLA', 'PETG', 'ABS', 'Nylon', 'TPU', 'Reçine', 'Emin Değilim'].map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      className={`hisa-chip hisa-chip--selectable ${formData.material === mat ? 'hisa-chip--selected' : ''}`}
                      onClick={() => handleMaterialSelect(mat)}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hisa-form-row">
                <div className="hisa-form-group">
                  <label htmlFor="quantity" className="hisa-form-label">Adet</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="hisa-form-input"
                  />
                </div>

                <div className="hisa-form-group">
                  <label htmlFor="deliveryExpectation" className="hisa-form-label">
                    Teslimat Beklentisi <span className="hisa-form-required">*</span>
                  </label>
                  <select
                    id="deliveryExpectation"
                    name="deliveryExpectation"
                    value={formData.deliveryExpectation}
                    onChange={handleInputChange}
                    className={`hisa-form-select ${errors.deliveryExpectation ? 'hisa-form-input--error' : ''}`}
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value="urgent">Acil (24-48 saat)</option>
                    <option value="standard">Standart (3-5 gün)</option>
                    <option value="flexible">Esnek</option>
                  </select>
                  {errors.deliveryExpectation && <div className="hisa-form-error">{errors.deliveryExpectation}</div>}
                </div>
              </div>

              <div className="hisa-form-group">
                <label htmlFor="city" className="hisa-form-label">Şehir (opsiyonel)</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Teslimat için"
                  className="hisa-form-input"
                />
              </div>

              <div className="hisa-form-group">
                <label htmlFor="notes" className="hisa-form-label">Ek Notlar</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Eklemek istediğiniz başka bir şey var mı?"
                  rows={3}
                  className="hisa-form-textarea"
                />
              </div>

              <div className="hisa-form-group">
                <label className="hisa-form-checkbox">
                  <input
                    type="checkbox"
                    name="kvkkConsent"
                    checked={formData.kvkkConsent}
                    onChange={handleInputChange}
                  />
                  <span className="hisa-form-checkbox__text">
                    <span className="hisa-form-required">*</span> Kişisel verilerimin işlenmesini kabul ediyorum (KVKK)
                  </span>
                </label>
                {errors.kvkkConsent && <div className="hisa-form-error">{errors.kvkkConsent}</div>}
              </div>

              {submitError && (
                <div className="hisa-form-alert hisa-form-alert--error">
                  {submitError}
                </div>
              )}

              <div className="hisa-form-actions">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hisa-btn hisa-btn--ghost"
                  disabled={submitting}
                >
                  ← Geri
                </button>
                <button
                  type="submit"
                  className="hisa-btn hisa-btn--primary hisa-btn--large"
                  disabled={submitting}
                >
                  {submitting ? 'Gönderiliyor...' : 'Teklif Gönder'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
