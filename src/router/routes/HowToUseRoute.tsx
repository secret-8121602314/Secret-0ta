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
  const connectionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const webSocketOpenedRef = React.useRef<boolean>(false);

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
      // Clear any pending timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
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
    console.log('[HowToUseRoute] handleConnect called with code:', code);
    // Reset error state for retry
    setError(null);
    setStatus(ConnectionStatus.CONNECTING);
    setConnectionCode(code);
    webSocketOpenedRef.current = false;

    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Set timeout for connection attempt (15 seconds - allows for Render.com cold start)
    connectionTimeoutRef.current = setTimeout(() => {
      console.log('[HowToUseRoute] Connection timeout after 15 seconds, webSocketOpened:', webSocketOpenedRef.current);
      disconnectWebSocket();
      
      if (webSocketOpenedRef.current) {
        // WebSocket connected to relay, but no partner_connected received
        setError('No PC client found with this code. Please check that:\n• The code is correct (all 6 digits)\n• PC client is running and showing the same code');
      } else {
        // WebSocket never connected to relay server
        setError('Could not reach the relay server. Please check your internet connection and try again.');
      }
      setStatus(ConnectionStatus.ERROR);
      // Remove the invalid code from localStorage
      localStorage.removeItem('otakon_connection_code');
      localStorage.removeItem('otakon_last_connection');
    }, 15000);

    // DON'T save code to localStorage yet - wait until connection is confirmed
    // localStorage.setItem('otakon_connection_code', code);
    // localStorage.setItem('otakon_last_connection', new Date().toISOString());

    // Connect via WebSocket
    connectWebSocket(
      code,
      // onOpen
      () => {
        console.log('[HowToUseRoute] ✅ WebSocket connection opened to relay server, waiting for partner_connected...');
        webSocketOpenedRef.current = true;
        // Don't set as connected yet - wait for PC client response
      },
      // onMessage
      (data: Record<string, unknown>) => {
        console.log('[HowToUseRoute] WebSocket message received:', data.type, data);
        // Check if this is a connection confirmation from PC client
        // PC client sends: {type: 'partner_connected'} immediately, then {type: 'connection_alive'} later
        if (data.type === 'partner_connected' || data.type === 'connection_alive' || data.type === 'connected' || data.status === 'connected') {
          console.log('[HowToUseRoute] ✅ Partner connected! Setting status to CONNECTED');
          // Clear timeout on successful connection
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }

          setStatus(ConnectionStatus.CONNECTED);
          setError(null);
          
          // NOW save the code to localStorage since connection is confirmed
          localStorage.setItem('otakon_connection_code', code);
          localStorage.setItem('otakon_last_connection', new Date().toISOString());
          
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
        console.error('[HowToUseRoute] ❌ WebSocket error:', errorMsg);
        
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
        setError(displayError);
        setStatus(ConnectionStatus.ERROR);
        // Reset connection code so user can try again
        setConnectionCode(code);
      },
      // onClose
      () => {
        console.log('[HowToUseRoute] WebSocket connection closed, webSocketOpened:', webSocketOpenedRef.current);
        // Only update status if we're in CONNECTING state and keep it there for timeout
        // Don't override ERROR or CONNECTED states
        setStatus(prev => {
          if (prev === ConnectionStatus.CONNECTING) {
            return prev; // Keep CONNECTING, let timeout handle it
          }
          if (prev === ConnectionStatus.ERROR) {
            return prev; // Keep ERROR state
          }
          if (prev === ConnectionStatus.CONNECTED) {
            return ConnectionStatus.DISCONNECTED;
          }
          return ConnectionStatus.DISCONNECTED;
        });
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
