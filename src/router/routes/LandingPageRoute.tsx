import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLoaderData } from 'react-router-dom';
import LandingPage from '../../components/LandingPageFresh';
import AboutModal from '../../components/modals/AboutModal';
import PrivacyModal from '../../components/modals/PrivacyModal';
import TermsModal from '../../components/modals/TermsModal';
import RefundPolicyModal from '../../components/modals/RefundPolicyModal';
import ContactUsModal from '../../components/modals/ContactUsModal';
import type { User, OnboardingStatus } from '../../types';

/**
 * Route wrapper for LandingPage - converts React Router navigation to component props
 * Handles modals via URL search params (?modal=about, ?modal=privacy, etc.)
 */
const LandingPageRoute: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const loaderData = useLoaderData() as { user: Partial<User> | null; onboardingStatus: OnboardingStatus };

  console.log('[LandingPageRoute] Component rendered, current URL:', window.location.href);
  console.log('[LandingPageRoute] Search params:', Object.fromEntries(searchParams.entries()));
  console.log('[LandingPageRoute] Loader data:', loaderData);

  // Redirect authenticated users to appropriate screen
  useEffect(() => {
    if (loaderData?.user && loaderData.onboardingStatus) {
      const { onboardingStatus } = loaderData;
      console.log('[LandingPageRoute] User is authenticated, onboarding status:', onboardingStatus);
      
      // Only redirect if onboarding status is valid
      if (onboardingStatus === 'complete') {
        console.log('[LandingPageRoute] Onboarding complete, redirecting to /app');
        navigate('/app', { replace: true });
      } else if (onboardingStatus !== 'login') {
        console.log('[LandingPageRoute] Onboarding in progress, redirecting to /onboarding');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [loaderData, navigate]);

  // Sync modal state with URL params
  useEffect(() => {
    const modal = searchParams.get('modal');
    setActiveModal(modal);
  }, [searchParams]);

  const handleGetStarted = () => {
    console.log('[LandingPageRoute] handleGetStarted clicked, navigating to /login');
    navigate('/login');
  };

  const handleOpenAbout = () => {
    setSearchParams({ modal: 'about' });
  };

  const handleOpenPrivacy = () => {
    setSearchParams({ modal: 'privacy' });
  };

  const handleOpenRefund = () => {
    setSearchParams({ modal: 'refund' });
  };

  const handleOpenTerms = () => {
    setSearchParams({ modal: 'terms' });
  };

  const handleOpenContact = () => {
    setSearchParams({ modal: 'contact' });
  };

  const handleCloseModal = () => {
    setSearchParams({});
  };

  const handleDirectNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <LandingPage
        onGetStarted={handleGetStarted}
        onOpenAbout={handleOpenAbout}
        onOpenPrivacy={handleOpenPrivacy}
        onOpenRefund={handleOpenRefund}
        onOpenTerms={handleOpenTerms}
        onOpenContact={handleOpenContact}
        onDirectNavigation={handleDirectNavigation}
      />
      {/* Modals controlled by URL params */}
      <AboutModal isOpen={activeModal === 'about'} onClose={handleCloseModal} />
      <PrivacyModal isOpen={activeModal === 'privacy'} onClose={handleCloseModal} />
      <TermsModal isOpen={activeModal === 'terms'} onClose={handleCloseModal} />
      <RefundPolicyModal isOpen={activeModal === 'refund'} onClose={handleCloseModal} />
      <ContactUsModal isOpen={activeModal === 'contact'} onClose={handleCloseModal} />
    </>
  );
};

export default LandingPageRoute;
