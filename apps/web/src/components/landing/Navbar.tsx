interface NavbarProps {
  onUploadClick: () => void;
}

export function Navbar({ onUploadClick }: NavbarProps) {
  return (
    <nav className="landing-nav">
      <div className="container">
        <div className="nav-logo">
          <span className="nav-logo-icon">◈</span>
          3D Print Estimator
        </div>
        
        <div className="nav-links">
          <a href="#nasil-calisir" className="nav-anchor">Nasıl çalışır?</a>
          <a href="#teknolojiler" className="nav-anchor">Teknolojiler</a>
          <a href="#sss" className="nav-anchor">SSS</a>
          <button className="nav-cta" onClick={onUploadClick}>
            STL Yükle
          </button>
        </div>
      </div>
    </nav>
  );
}

