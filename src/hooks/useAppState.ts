import { useState, useCallback, useMemo } from 'react';
import { AuthState, AppState, ConnectionStatus } from '../types';

// UI State interface for modal and UI-specific state
interface UIState {
  activeModal: string | null;
  settingsOpen: boolean;
  showLogoutConfirm: boolean;
  isInitializing: boolean;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
}

// Initial state values
const initialAuthState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

const initialAppState: AppState = {
  view: 'landing',
  onboardingStatus: 'initial',
  activeSubView: 'chat',
  isConnectionModalOpen: false,
  isHandsFreeModalOpen: false,
  isSettingsModalOpen: false,
  isCreditModalOpen: false,
  isOtakuDiaryModalOpen: false,
  isWishlistModalOpen: false,
  activeModal: null,
  isHandsFreeMode: false,
  showUpgradeScreen: false,
  showDailyCheckin: false,
  currentAchievement: null,
  loadingMessages: [],
  isCooldownActive: false,
  isFirstTime: true,
  contextMenu: null,
  feedbackModalState: null,
  confirmationModal: null,
  trialEligibility: null,
};

const initialUIState: UIState = {
  activeModal: null,
  settingsOpen: false,
  showLogoutConfirm: false,
  isInitializing: true,
  connectionStatus: ConnectionStatus.DISCONNECTED,
  connectionError: null,
};

/**
 * Custom hook for managing app state
 * Consolidates related state variables and provides optimized update methods
 */
export const useAppState = () => {
  // Core state
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [uiState, setUIState] = useState<UIState>(initialUIState);
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState(false);

  // Optimized update methods
  const updateAuth = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateApp = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUI = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // Computed values
  const isAuthenticated = useMemo(() => {
    return !!authState.user && !authState.isLoading;
  }, [authState.user, authState.isLoading]);

  const isOnboardingComplete = useMemo(() => {
    return appState.onboardingStatus === 'complete';
  }, [appState.onboardingStatus]);

  const shouldShowMainApp = useMemo(() => {
    return isAuthenticated && isOnboardingComplete;
  }, [isAuthenticated, isOnboardingComplete]);

  // Reset methods
  const resetAuth = useCallback(() => {
    setAuthState(initialAuthState);
  }, []);

  const resetApp = useCallback(() => {
    setAppState(initialAppState);
  }, []);

  const resetUI = useCallback(() => {
    setUIState(initialUIState);
  }, []);

  const resetAll = useCallback(() => {
    resetAuth();
    resetApp();
    resetUI();
    setHasEverLoggedIn(false);
  }, [resetAuth, resetApp, resetUI]);

  return {
    // State
    authState,
    appState,
    uiState,
    hasEverLoggedIn,
    
    // Update methods
    updateAuth,
    updateApp,
    updateUI,
    setHasEverLoggedIn,
    
    // Computed values
    isAuthenticated,
    isOnboardingComplete,
    shouldShowMainApp,
    
    // Reset methods
    resetAuth,
    resetApp,
    resetUI,
    resetAll,
  };
};
