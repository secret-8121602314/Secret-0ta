import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLoaderData, useSearchParams, useRevalidator } from 'react-router-dom';
import MainApp from '../../components/MainApp';
import AboutModal from '../../components/modals/AboutModal';
import PrivacyModal from '../../components/modals/PrivacyModal';
import TermsModal from '../../components/modals/TermsModal';
import { ConnectionStatus, type User } from '../../types';
import { connect as connectWebSocket, disconnect as disconnectWebSocket } from '../../services/websocketService';
import { isPWAMode } from '../../utils/pwaDetection';

/**
 * Route wrapper for MainApp
 * Bridges React Router navigation with component props
 * Handles footer modals via URL search params
 * Note: MainApp manages its own user state internally via authService subscription
 */
const MainAppRoute: React.FC = () => {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  // User from loader is used for profile setup banner logic
  const { user } = useLoaderData() as { user: User | null };
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Track connection code internally for state management
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webSocketOpenedRef = useRef<boolean>(false);

  // WebSocket message handler - needs to be defined before useEffect
  const handleWebSocketMessage = useCallback((data: Record<string, unknown>) => {
    console.log('[MainAppRoute] WebSocket message received:', data.type, data);
    
    // Check if this is a connection confirmation from PC client
    if (data.type === 'partner_connected' || data.type === 'connection_alive' || data.type === 'connected' || data.status === 'connected') {
      console.log('[MainAppRoute] ✅ Partner connected! Setting status to CONNECTED');
      
      // Clear timeout on successful connection
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setConnectionError(null);
      
      // Now that connection is confirmed, set the connectionCode state
      const confirmedCode = pendingCodeRef.current || localStorage.getItem('otakon_connection_code');
      if (confirmedCode) {
        setConnectionCode(confirmedCode);
        localStorage.setItem('otakon_connection_code', confirmedCode);
        localStorage.setItem('otakon_last_connection', new Date().toISOString());
        localStorage.setItem('otakonHasConnectedBefore', 'true');
      }
    }
    
    // ✅ Handle partner disconnection - PC app closed or lost connection
    if (data.type === 'partner_disconnected' || data.type === 'partner_left' || data.type === 'peer_disconnected') {
      console.log('[MainAppRoute] ⚠️ Partner disconnected! PC app may have closed.');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setConnectionCode(null);
      setConnectionError(null);
      // Clear saved connection data since partner is gone
      localStorage.removeItem('otakon_connection_code');
      localStorage.removeItem('otakon_last_connection');
      return;
    }
    
    // Handle pong (heartbeat response) - just ignore
    if (data.type === 'pong') {
      return;
    }
  }, []);

  // Initialize connection state from localStorage on mount
  // Note: We only restore the code, NOT the connection status
  // The actual connection status will be determined by WebSocket events
  useEffect(() => {
    const savedCode = localStorage.getItem('otakon_connection_code');
    if (savedCode) {
      console.log('[MainAppRoute] Found saved connection code, attempting to reconnect...');
      setConnectionCode(savedCode);
      // Don't set CONNECTED here - initiate actual WebSocket connection
      // and wait for partner_connected message
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
    
    // ✅ PWA FIX: Clear sessionStorage to prevent state restoration on reopen
    sessionStorage.clear();
    console.log('🧹 [MainAppRoute] SessionStorage cleared to prevent state restoration');
    
    // ✅ PWA FIX: Dispatch a custom event BEFORE signOut to notify components to reset their refs
    window.dispatchEvent(new CustomEvent('otakon:user-logout'));
    console.log('🎯 [MainAppRoute] Dispatched otakon:user-logout event');
    
    // ✅ PWA FIX: Check if running as PWA
    const isPWA = isPWAMode();
    
    if (isPWA) {
      // ✅ PWA CRITICAL FIX: Notify service worker of logout IMMEDIATELY
      // This sets in-memory flag to prevent serving cached pages
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_AUTH_CACHE'
          });
          console.log('📱 [PWA] Notified service worker of logout immediately');
          
          // ✅ CRITICAL: Wait longer (300ms) for service worker to set the logout flag
          // This ensures the flag is set BEFORE reload happens
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('📱 [PWA] Failed to notify service worker:', error);
        }
      }
      
      // ✅ PWA CRITICAL FIX: For PWA, immediately set logout flag BEFORE async signOut
      // This prevents black screen race condition with browser tabs
      const logoutTimestamp = Date.now();
      localStorage.setItem('otakon_just_logged_out', logoutTimestamp.toString());
      localStorage.setItem('otakon_logout_instance', isPWA ? 'pwa' : 'browser');
      console.log('📱 [PWA] Set logout flag immediately:', logoutTimestamp);
      
      // Clear ALL app-related sessionStorage to prevent state leakage
      sessionStorage.clear();
      
      // Navigate to login page first (this clears URL state)
      window.history.replaceState(null, '', '/earlyaccess');
    }
    
    // Now sign out (this is async and may trigger cross-tab events)
    await authService.signOut();
    
    if (isPWA) {
      // ✅ CRITICAL FIX: For PWA, force a full hard reload to clear all state
      // This prevents black screen and ensures clean login experience
      console.log('📱 [PWA] Forcing full hard reload after logout to clear state');
      
      // ✅ CRITICAL FIX: Use reload() to force hard reload, bypassing ALL caches
      // Longer timeout ensures SW has processed the message
      setTimeout(() => {
        window.location.reload();
      }, 350); // Increased timeout to ensure SW logout flag is set
      
      // ✅ CRITICAL: Return here to prevent any further code execution
      return;
    }
    
    // Navigate to login page after logout (for non-PWA)
    navigate('/earlyaccess');
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

  // Track the pending connection code (not yet confirmed)
  const pendingCodeRef = useRef<string | null>(null);

  const handleConnect = (code: string) => {
    console.log('[MainAppRoute] handleConnect called with code:', code);
    
    // Reset error state for retry
    setConnectionError(null);
    setConnectionStatus(ConnectionStatus.CONNECTING);
    // Don't set connectionCode state yet - wait for successful connection
    // Store in ref for use when connection is confirmed
    pendingCodeRef.current = code;
    webSocketOpenedRef.current = false;

    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Set timeout for connection attempt (15 seconds - increased for slow networks)
    connectionTimeoutRef.current = setTimeout(() => {
      console.log('[MainAppRoute] Connection timeout after 15 seconds, webSocketOpened:', webSocketOpenedRef.current);
      disconnectWebSocket();
      
      if (webSocketOpenedRef.current) {
        // WebSocket connected to relay, but no partner_connected received
        setConnectionError('No PC client found with this code. Please check that:\n• The code is correct (all 6 digits)\n• PC client is running and showing the same code');
      } else {
        // WebSocket never connected to relay server
        setConnectionError('Could not reach the relay server. Please check your internet connection and try again.');
      }
      setConnectionStatus(ConnectionStatus.ERROR);
      // Remove the invalid code from localStorage
      localStorage.removeItem('otakon_connection_code');
      localStorage.removeItem('otakon_last_connection');
    }, 15000);

    // Don't save code to localStorage yet - wait for partner_connected confirmation

    // Actually connect via WebSocket!
    connectWebSocket(
      code,
      // onOpen - WebSocket connection opened (but partner not yet confirmed)
      () => {
        console.log('[MainAppRoute] ✅ WebSocket connection opened to relay server, waiting for partner_connected...');
        webSocketOpenedRef.current = true;
        // Don't set CONNECTED yet - wait for partner_connected message
      },
      // onMessage - Handle messages including partner_connected
      handleWebSocketMessage,
      // onError
      (errorMsg: string) => {
        console.error('[MainAppRoute] ❌ WebSocket error callback:', errorMsg);
        
        // Clear timeout on error
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Clear saved connection code on error
        localStorage.removeItem('otakon_connection_code');
        localStorage.removeItem('otakon_last_connection');
        
        // User-friendly error messages based on whether we reached the server
        let displayError = errorMsg;
        if (errorMsg.includes('Connection to the server failed') || errorMsg.includes('Connection closed unexpectedly')) {
          if (webSocketOpenedRef.current) {
            displayError = 'Connection lost. Please try again.';
          } else {
            displayError = 'Could not connect to relay server. Please check your internet connection.';
          }
        } else if (errorMsg.includes('Invalid code')) {
          displayError = 'Please enter a valid 6-digit code';
        } else if (errorMsg.includes('No PC client found')) {
          displayError = 'No PC client found with this code. Please check that:\n• The code is correct\n• PC client is running and showing the same code';
        }
        setConnectionError(displayError);
        setConnectionStatus(ConnectionStatus.ERROR);
      },
      // onClose
      () => {
        console.log('[MainAppRoute] WebSocket connection closed, webSocketOpened:', webSocketOpenedRef.current);
        // Only update status if we're still in CONNECTING state
        // Don't override ERROR or CONNECTED states
        setConnectionStatus(prev => {
          if (prev === ConnectionStatus.CONNECTING) {
            console.log('[MainAppRoute] Connection closed while connecting - may be waiting for timeout');
            return prev; // Keep CONNECTING, let timeout handle it
          }
          if (prev === ConnectionStatus.ERROR) {
            return prev; // Keep ERROR state
          }
          if (prev === ConnectionStatus.CONNECTED) {
            console.log('[MainAppRoute] Connection lost after being connected');
            return ConnectionStatus.DISCONNECTED;
          }
          return ConnectionStatus.DISCONNECTED;
        });
      }
    );
  };

  const handleDisconnect = () => {
    console.log('[MainAppRoute] handleDisconnect called');
    
    // Clear any pending timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    disconnectWebSocket();
    setConnectionCode(null);
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setConnectionError(null);
    localStorage.removeItem('otakon_connection_code');
    localStorage.removeItem('otakon_last_connection');
  };

  const handleClearError = () => {
    setConnectionError(null);
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
  };

  return (
    <>
      <MainApp
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
        onOpenAbout={handleOpenAbout}
        onOpenPrivacy={handleOpenPrivacy}
        onOpenTerms={handleOpenTerms}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        connectionCode={connectionCode}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onClearConnectionError={handleClearError}
        showProfileSetupBanner={!user?.hasProfileSetup}
        onProfileSetupComplete={async (profileData) => {
          console.log('🔍 [DEBUG MainAppRoute] onProfileSetupComplete called with:', profileData);
          try {
            // Save profile data and mark setup as complete
            const { onboardingService } = await import('../../services/onboardingService');
            
            if (user?.authUserId) {
              console.log('🔍 [DEBUG MainAppRoute] Calling markProfileSetupComplete for user:', user.authUserId);
              await onboardingService.markProfileSetupComplete(user.authUserId, profileData as unknown as Record<string, unknown>);
              
              console.log('🔍 [DEBUG MainAppRoute] Calling revalidator.revalidate()');
              // Trigger router to refetch user data from loader
              revalidator.revalidate();
              console.log('🔍 [DEBUG MainAppRoute] Profile setup complete flow finished');
            }
          } catch (error) {
            console.error('❌ [DEBUG MainAppRoute] Error completing profile setup:', error);
          }
        }}
        onProfileSetupDismiss={async () => {
          try {
            // Mark as dismissed in database (without saving profile data)
            const { onboardingService } = await import('../../services/onboardingService');
            
            if (user?.authUserId) {
              await onboardingService.markProfileSetupComplete(user.authUserId, {});
              
              // Trigger router to refetch user data from loader
              revalidator.revalidate();
            }
          } catch (error) {
            console.error('Error dismissing profile setup:', error);
          }
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
