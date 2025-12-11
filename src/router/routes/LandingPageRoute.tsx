import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLoaderData } from 'react-router-dom';
import LandingPage from '../../components/LandingPageFresh';
import AboutModal from '../../components/modals/AboutModal';
import PrivacyModal from '../../components/modals/PrivacyModal';
import TermsModal from '../../components/modals/TermsModal';
import RefundPolicyModal from '../../components/modals/RefundPolicyModal';
import ContactUsModal from '../../components/modals/ContactUsModal';
import BlogIndexModal from '../../components/modals/BlogIndexModal';
import BlogPostModal from '../../components/modals/BlogPostModal';
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

    console.log('[LandingPageRoute] Search params:', Object.fromEntries(searchParams.entries()));
    // Redirect authenticated users to appropriate screen
  useEffect(() => {
    if (loaderData?.user && loaderData.onboardingStatus) {
      const { onboardingStatus } = loaderData;
            // Only redirect if onboarding status is valid
      if (onboardingStatus === 'complete') {
                navigate('/app', { replace: true });
      } else if (onboardingStatus !== 'login') {
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

  const handleOpenBlog = () => {
    setSearchParams({ modal: 'blog' });
  };

  const handleSelectBlogPost = (slug: string) => {
    setSearchParams({ modal: 'blog-post', slug });
  };

  const handleBackToBlog = () => {
    setSearchParams({ modal: 'blog' });
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
        onOpenBlog={handleOpenBlog}
        onSelectBlogPost={handleSelectBlogPost}
        onDirectNavigation={handleDirectNavigation}
      />
      {/* Modals controlled by URL params */}
      <AboutModal isOpen={activeModal === 'about'} onClose={handleCloseModal} />
      <PrivacyModal isOpen={activeModal === 'privacy'} onClose={handleCloseModal} />
      <TermsModal isOpen={activeModal === 'terms'} onClose={handleCloseModal} />
      <RefundPolicyModal isOpen={activeModal === 'refund'} onClose={handleCloseModal} />
      <ContactUsModal isOpen={activeModal === 'contact'} onClose={handleCloseModal} />
      <BlogIndexModal 
        isOpen={activeModal === 'blog'} 
        onClose={handleCloseModal} 
        onSelectPost={handleSelectBlogPost}
      />
      <BlogPostModal 
        isOpen={activeModal === 'blog-post'} 
        onClose={handleCloseModal} 
        onBack={handleBackToBlog}
        slug={searchParams.get('slug')}
        onSelectPost={handleSelectBlogPost}
      />
    </>
  );
};

export default LandingPageRoute;
