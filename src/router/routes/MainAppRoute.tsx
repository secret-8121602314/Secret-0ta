import React, { useState, useEffect } from 'react';
import { useNavigate, useLoaderData, useSearchParams } from 'react-router-dom';
import MainApp from '../../components/MainApp';
import AboutModal from '../../components/modals/AboutModal';
import PrivacyModal from '../../components/modals/PrivacyModal';
import TermsModal from '../../components/modals/TermsModal';
import { ConnectionStatus } from '../../types';
import type { User } from '../../types';

/**
 * Route wrapper for MainApp
 * Bridges React Router navigation with component props
 * Handles footer modals via URL search params
 */
const MainAppRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: User | null };
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);

  // Initialize connection state from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('otakon_connection_code');
    if (savedCode) {
            setConnectionCode(savedCode);
      setConnectionStatus(ConnectionStatus.CONNECTED);
    }
  }, []);

  // Sync modal state with URL params
  useEffect(() => {
    const modal = searchParams.get('modal');
    setActiveModal(modal);
  }, [searchParams]);

  const handleLogout = async () => {
    // Import authService dynamically to avoid circular deps
    const { authService } = await import('../../services/authService');
    await authService.signOut();
    // Navigate to login page after logout
    navigate('/login');
  };

  const handleOpenSettings = () => {
    // TODO: Implement settings navigation
      };

  const handleOpenAbout = () => {
    setSearchParams({ modal: 'about' });
  };

  const handleOpenPrivacy = () => {
    setSearchParams({ modal: 'privacy' });
  };

  const handleOpenTerms = () => {
    setSearchParams({ modal: 'terms' });
  };

  const handleCloseModal = () => {
    setSearchParams({});
  };

  const handleConnect = (code: string) => {
        setConnectionCode(code);
    setConnectionStatus(ConnectionStatus.CONNECTED);
  };

  const handleDisconnect = () => {
        setConnectionCode(null);
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
  };

  return (
    <>
      <MainApp
        user={user}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
        onOpenAbout={handleOpenAbout}
        onOpenPrivacy={handleOpenPrivacy}
        onOpenTerms={handleOpenTerms}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        pcConnectionCode={connectionCode}
        pcConnectionError={null}
        isGamesRefreshing={false}
        isConversationsRefreshing={false}
        isOAuthProcessing={false}
        isPcConnecting={false}
        isPcDisconnecting={false}
        hasPendingRequests={false}
        showProfileSetupBanner={!user?.hasProfileSetup}
        onProfileSetupComplete={async (profileData) => {
                    // Save profile data and mark setup as complete
          const { authService } = await import('../../services/authService');
          await authService.updateUser({ 
            has_profile_setup: true,
            profile_data: profileData
          });
          // Refresh to show updated state
          window.location.reload();
        }}
        onProfileSetupDismiss={async () => {
                    // Mark as dismissed in database (without saving profile data)
          const { authService } = await import('../../services/authService');
          await authService.updateUser({ has_profile_setup: true });
          // Force re-render without full page reload
          window.location.reload();
        }}
      />
      {/* Footer modals controlled by URL params */}
      <AboutModal isOpen={activeModal === 'about'} onClose={handleCloseModal} />
      <PrivacyModal isOpen={activeModal === 'privacy'} onClose={handleCloseModal} />
      <TermsModal isOpen={activeModal === 'terms'} onClose={handleCloseModal} />
    </>
  );
};

export default MainAppRoute;
