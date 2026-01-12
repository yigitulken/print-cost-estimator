import { useState, useEffect } from 'react';

interface HeaderProps {
  onCtaClick: () => void;
}

export function Header({ onCtaClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <header className={`hisa-header ${scrolled ? 'hisa-header--scrolled' : ''}`}>
        <div className="hisa-container">
          <div className="hisa-header__content">
            <div className="hisa-header__logo">
              <span className="hisa-header__logo-icon">🏭</span>
              <span className="hisa-header__logo-text">Hisa3D</span>
            </div>

            <nav className="hisa-header__nav" aria-label="Main navigation">
              <a
                href="#use-cases"
                className="hisa-header__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('use-cases');
                }}
              >
                Kullanım Alanları
              </a>
              <a
                href="#services"
                className="hisa-header__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('services');
                }}
              >
                Hizmetler
              </a>
              <a
                href="#portfolio"
                className="hisa-header__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('portfolio');
                }}
              >
                Portföy
              </a>
              <a
                href="#estimator"
                className="hisa-header__link"
              >
                Fiyat Hesaplama
              </a>
              <a
                href="#faq"
                className="hisa-header__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('faq');
                }}
              >
                SSS
              </a>
            </nav>

            <div className="hisa-header__actions">
              <a
                href="https://wa.me/905XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="hisa-header__whatsapp"
                aria-label="WhatsApp ile iletişime geç"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              
              <button
                type="button"
                className="hisa-btn hisa-btn--primary"
                onClick={onCtaClick}
              >
                Teklif Al
              </button>

              <button
                type="button"
                className="hisa-header__hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              >
                <span className={`hisa-hamburger__line ${mobileMenuOpen ? 'hisa-hamburger__line--open' : ''}`}></span>
                <span className={`hisa-hamburger__line ${mobileMenuOpen ? 'hisa-hamburger__line--open' : ''}`}></span>
                <span className={`hisa-hamburger__line ${mobileMenuOpen ? 'hisa-hamburger__line--open' : ''}`}></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="hisa-mobile-menu"
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setMobileMenuOpen(false);
            }
          }}
        >
          <div className="hisa-mobile-menu__content">
            <nav className="hisa-mobile-menu__nav" aria-label="Mobile navigation">
              <a
                href="#use-cases"
                className="hisa-mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('use-cases');
                }}
              >
                Kullanım Alanları
              </a>
              <a
                href="#services"
                className="hisa-mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('services');
                }}
              >
                Hizmetler
              </a>
              <a
                href="#portfolio"
                className="hisa-mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('portfolio');
                }}
              >
                Portföy
              </a>
              <a
                href="#estimator"
                className="hisa-mobile-menu__link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fiyat Hesaplama
              </a>
              <a
                href="#faq"
                className="hisa-mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('faq');
                }}
              >
                SSS
              </a>
            </nav>

            <div className="hisa-mobile-menu__actions">
              <a
                href="https://wa.me/905XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="hisa-btn hisa-btn--ghost"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              
              <button
                type="button"
                className="hisa-btn hisa-btn--primary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onCtaClick();
                }}
              >
                Teklif Al
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
