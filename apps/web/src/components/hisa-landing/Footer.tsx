export function Footer() {
  return (
    <footer className="hisa-footer">
      <div className="hisa-container">
        <div className="hisa-footer__content">
          <div className="hisa-footer__brand">
            <div className="hisa-footer__logo">
              <span className="hisa-footer__logo-icon">🏭</span>
              <span className="hisa-footer__logo-text">Hisa3D</span>
            </div>
            <p className="hisa-footer__tagline">
              Endüstriyel 3D baskı çözümleri
            </p>
          </div>

          <div className="hisa-footer__links">
            <div className="hisa-footer__column">
              <h3 className="hisa-footer__heading">Hizmetler</h3>
              <ul className="hisa-footer__list">
                <li><a href="#services" className="hisa-footer__link">Tasarım</a></li>
                <li><a href="#services" className="hisa-footer__link">Baskı</a></li>
                <li><a href="#services" className="hisa-footer__link">Tasarım + Baskı</a></li>
              </ul>
            </div>

            <div className="hisa-footer__column">
              <h3 className="hisa-footer__heading">Şirket</h3>
              <ul className="hisa-footer__list">
                <li><a href="#portfolio" className="hisa-footer__link">Portföy</a></li>
                <li><a href="#faq" className="hisa-footer__link">SSS</a></li>
                <li><a href="#quote-form" className="hisa-footer__link">İletişim</a></li>
              </ul>
            </div>

            <div className="hisa-footer__column">
              <h3 className="hisa-footer__heading">Araçlar</h3>
              <ul className="hisa-footer__list">
                <li><a href="#estimator" className="hisa-footer__link">STL Maliyet Hesaplayıcı</a></li>
              </ul>
            </div>

            <div className="hisa-footer__column">
              <h3 className="hisa-footer__heading">İletişim</h3>
              <ul className="hisa-footer__list">
                <li>
                  <a
                    href="mailto:info@hisa3d.com"
                    className="hisa-footer__link"
                  >
                    info@hisa3d.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/905XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hisa-footer__link"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hisa-footer__bottom">
          <p className="hisa-footer__copyright">
            © {new Date().getFullYear()} Hisa3D. Tüm hakları saklıdır.
          </p>
          <div className="hisa-footer__legal">
            <a href="#" className="hisa-footer__legal-link">Gizlilik Politikası</a>
            <span className="hisa-footer__separator">•</span>
            <a href="#" className="hisa-footer__legal-link">KVKK</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
