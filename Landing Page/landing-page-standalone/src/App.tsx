import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import ContactUsModal from "./components/ContactUsModal";
import AboutModal from "./components/AboutModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import RefundPolicyModal from "./components/RefundPolicyModal";

const App: React.FC = () => {
  // Modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // URL routing for modals
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      
      // Close all modals first
      setIsContactModalOpen(false);
      setIsAboutModalOpen(false);
      setIsPrivacyModalOpen(false);
      setIsRefundModalOpen(false);
      
      // Open modal based on URL
      switch (path) {
        case '/about':
          setIsAboutModalOpen(true);
          break;
        case '/privacy':
          setIsPrivacyModalOpen(true);
          break;
        case '/refund':
          setIsRefundModalOpen(true);
          break;
        case '/contact':
          setIsContactModalOpen(true);
          break;
        default:
          break;
      }
    };

    // Handle initial route
    handleRouteChange();

    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Function to handle direct URL navigation
  const handleDirectNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    const event = new PopStateEvent('popstate');
    window.dispatchEvent(event);
  };

  // Function to handle modal close with URL reset
  const handleModalClose = (modalType: 'about' | 'privacy' | 'refund' | 'contact') => {
    switch (modalType) {
      case 'about':
        setIsAboutModalOpen(false);
        break;
      case 'privacy':
        setIsPrivacyModalOpen(false);
        break;
      case 'refund':
        setIsRefundModalOpen(false);
        break;
      case 'contact':
        setIsContactModalOpen(false);
        break;
    }
    window.history.pushState({}, '', '/');
  };

  const handleGetStarted = () => {
    console.log("Get Started clicked");
    // This can be customized for the standalone version
  };

  const handleOpenAbout = () => {
    window.history.pushState({}, '', '/about');
    setIsAboutModalOpen(true);
  };

  const handleOpenPrivacy = () => {
    window.history.pushState({}, '', '/privacy');
    setIsPrivacyModalOpen(true);
  };

  const handleOpenRefund = () => {
    window.history.pushState({}, '', '/refund');
    setIsRefundModalOpen(true);
  };

  const handleOpenContact = () => {
    window.history.pushState({}, '', '/contact');
    setIsContactModalOpen(true);
  };

  return (
    <>
      <LandingPage
        onGetStarted={handleGetStarted}
        onOpenAbout={handleOpenAbout}
        onOpenPrivacy={handleOpenPrivacy}
        onOpenRefund={handleOpenRefund}
        onOpenContact={handleOpenContact}
        onDirectNavigation={handleDirectNavigation}
      />
      
      {/* Modals */}
      <ContactUsModal 
        isOpen={isContactModalOpen} 
        onClose={() => handleModalClose('contact')} 
      />
      <AboutModal 
        isOpen={isAboutModalOpen} 
        onClose={() => handleModalClose('about')} 
      />
      <PrivacyPolicyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => handleModalClose('privacy')} 
      />
      <RefundPolicyModal 
        isOpen={isRefundModalOpen} 
        onClose={() => handleModalClose('refund')} 
      />
    </>
  );
};

export default App;
