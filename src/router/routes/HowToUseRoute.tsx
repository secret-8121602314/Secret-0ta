import React from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import SplashScreen from '../../components/splash/SplashScreen';
import { ConnectionStatus } from '../../types';
import type { User } from '../../types';
import { supabase } from '../../lib/supabase';
import { connect as connectWebSocket, disconnect as disconnectWebSocket } from '../../services/websocketService';

/**
 * Route wrapper for SplashScreen (connection setup)
 * Bridges React Router navigation with component props
 */
const HowToUseRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: User | null };
  
  const [status, setStatus] = React.useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = React.useState<string | null>(null);
  const [connectionCode, setConnectionCode] = React.useState<string | null>(null);

  // Restore connection code from localStorage on mount
  React.useEffect(() => {
    const savedCode = localStorage.getItem('otakon_connection_code');
    if (savedCode) {
      setConnectionCode(savedCode);
          }
  }, []);

  // Cleanup: Disconnect WebSocket when user navigates away from this screen
  React.useEffect(() => {
    return () => {
      // Only disconnect if we're in CONNECTING state (user navigated away before completion)
      // Don't disconnect if CONNECTED - user successfully connected and moved forward
      if (status === ConnectionStatus.CONNECTING) {
                disconnectWebSocket();
        // Clear the pending connection code so user can try again
        setConnectionCode(null);
        setStatus(ConnectionStatus.DISCONNECTED);
      }
    };
  }, [status]);

  const handleSkipConnection = async () => {
        // Update database before navigation
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            pc_connection_skipped: true,
            has_seen_how_to_use: true,
            app_state: {
              onboardingStatus: 'pro-features',
              hasSeenHowToUse: true,
              pcConnectionSkipped: true,
              completedHowToUseAt: new Date().toISOString()
            }
          })
          .eq('auth_user_id', user.authUserId);
          
        if (error) {
          console.error('[HowToUseRoute] Failed to update database:', error);
        } else {
          console.log('[HowToUseRoute] Database updated, onboarding status: pro-features (skipped connection)');
        }
      } catch (error) {
        console.error('[HowToUseRoute] Error updating database:', error);
      }
    }
    
    // Skip users go directly to Pro Features screen
    navigate('/onboarding/pro-features');
  };

  const handleConnect = (code: string) => {
        // Reset error state for retry
    setError(null);
    setStatus(ConnectionStatus.CONNECTING);
    setConnectionCode(code);

    // Store code in localStorage for persistence (use same key as MainApp)
    localStorage.setItem('otakon_connection_code', code);
    localStorage.setItem('otakon_last_connection', new Date().toISOString());

    // Connect via WebSocket
    connectWebSocket(
      code,
      // onOpen
      () => {
                // Don't set as connected yet - wait for PC client response
      },
      // onMessage
      (data: Record<string, unknown>) => {
                // Check if this is a connection confirmation from PC client
        // PC client sends: {type: 'partner_connected'} immediately, then {type: 'connection_alive'} later
        if (data.type === 'partner_connected' || data.type === 'connection_alive' || data.type === 'connected' || data.status === 'connected') {
                    setStatus(ConnectionStatus.CONNECTED);
          setError(null);
          
          // Mark as having connected before
          localStorage.setItem('otakonHasConnectedBefore', 'true');
          
          // Update user database record with connection status
          if (user) {
            supabase
              .from('users')
              .update({
                pc_connected: true
              })
              .eq('auth_user_id', user.authUserId)
              .then(({ error: dbError }) => {
                if (dbError) {
                  console.error('[HowToUseRoute] Failed to update PC connection in database:', dbError);
                } else {
                                  }
              });
          }
        }
      },
      // onError
      (errorMsg: string) => {
        console.error('[HowToUseRoute] WebSocket error:', errorMsg);
        // User-friendly error messages
        let displayError = errorMsg;
        if (errorMsg.includes('Connection to the server failed')) {
          displayError = 'Unable to connect. Please check that:\n• The code is correct\n• PC client is running\n• Both devices are online';
        } else if (errorMsg.includes('Invalid code')) {
          displayError = 'Please enter a valid 6-digit code';
        }
        setError(displayError);
        setStatus(ConnectionStatus.ERROR);
        // Reset connection code so user can try again
        setConnectionCode(code);
      },
      // onClose
      () => {
                // Only set to disconnected if not in error state
        if (status !== ConnectionStatus.ERROR) {
          setStatus(ConnectionStatus.DISCONNECTED);
        }
      }
    );
  };

  const handleConnectionSuccess = async () => {
        // Navigate immediately for smooth UX
    navigate('/onboarding/features');
    
    // Update database in background (optimistic navigation)
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            pc_connected: true,
            has_seen_how_to_use: true,
            app_state: {
              onboardingStatus: 'features-connected',
              hasSeenHowToUse: true,
              pcConnected: true,
              completedHowToUseAt: new Date().toISOString()
            }
          })
          .eq('auth_user_id', user.authUserId);
          
        if (error) {
          console.error('[HowToUseRoute] Background DB update failed:', error);
        } else {
                  }
      } catch (error) {
        console.error('[HowToUseRoute] Background DB update error:', error);
      }
    }
  };

  return (
    <SplashScreen
      onSkipConnection={handleSkipConnection}
      onConnect={handleConnect}
      status={status}
      error={error}
      connectionCode={connectionCode}
      onConnectionSuccess={handleConnectionSuccess}
    />
  );
};

export default HowToUseRoute;
