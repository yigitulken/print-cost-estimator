import { useState, useEffect } from 'react';
import { HisaLandingPage } from './pages/HisaLandingPage';
import { EstimatorPage } from './pages/EstimatorPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'estimator'>('landing');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#estimator') {
        setCurrentPage('estimator');
      } else {
        setCurrentPage('landing');
      }
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return currentPage === 'estimator' ? <EstimatorPage /> : <HisaLandingPage />;
}

export default App;
