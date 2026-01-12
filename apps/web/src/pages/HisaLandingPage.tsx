import { useState, useRef, useEffect } from 'react';
import {
  Header,
  Hero,
  UseCases,
  Services,
  Process,
  Capabilities,
  Portfolio,
  SocialProof,
  FAQ,
  QuoteForm,
  Footer,
} from '../components/hisa-landing';
import './HisaLandingPage.css';

export function HisaLandingPage() {
  const [quoteFormPrefill, setQuoteFormPrefill] = useState<{
    serviceType?: string;
    useCase?: string;
    caseId?: string;
  }>({});

  const quoteFormRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

  const scrollToQuoteForm = () => {
    quoteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Dispatch analytics event
    window.dispatchEvent(new CustomEvent('lp_cta_click', { 
      detail: { placement: 'header' } 
    }));
  };

  const scrollToPortfolio = () => {
    portfolioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUseCaseClick = (useCase: string, serviceType: string) => {
    setQuoteFormPrefill({ useCase, serviceType });
    scrollToQuoteForm();
    
    // Dispatch analytics event
    window.dispatchEvent(new CustomEvent('lp_cta_click', { 
      detail: { placement: 'use-case', useCase } 
    }));
  };

  const handleServiceClick = (serviceType: string) => {
    setQuoteFormPrefill({ serviceType });
    scrollToQuoteForm();
    
    // Dispatch analytics event
    window.dispatchEvent(new CustomEvent('lp_cta_click', { 
      detail: { placement: 'service', serviceType } 
    }));
  };

  const handlePortfolioCaseSelect = (caseId: string) => {
    setQuoteFormPrefill({ caseId });
    scrollToQuoteForm();
    
    // Dispatch analytics event
    window.dispatchEvent(new CustomEvent('lp_portfolio_open', { 
      detail: { caseId } 
    }));
  };

  // Scroll reveal animation on mount
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('hisa-reveal--visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.hisa-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="hisa-landing">
      <Header onCtaClick={scrollToQuoteForm} />
      
      <Hero 
        onCtaClick={scrollToQuoteForm} 
        onPortfolioClick={scrollToPortfolio}
      />
      
      <div className="hisa-reveal">
        <UseCases onCaseClick={handleUseCaseClick} />
      </div>
      
      <div className="hisa-reveal">
        <Services onServiceClick={handleServiceClick} />
      </div>
      
      <div className="hisa-reveal">
        <Process />
      </div>
      
      <div className="hisa-reveal">
        <Capabilities />
      </div>
      
      <div className="hisa-reveal" ref={portfolioRef}>
        <Portfolio onCaseSelect={handlePortfolioCaseSelect} />
      </div>
      
      <div className="hisa-reveal">
        <SocialProof />
      </div>
      
      <div className="hisa-reveal">
        <FAQ />
      </div>
      
      <div className="hisa-reveal" ref={quoteFormRef}>
        <QuoteForm prefillData={quoteFormPrefill} />
      </div>
      
      <Footer />
    </div>
  );
}
