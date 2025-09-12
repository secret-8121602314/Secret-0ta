import { useState } from 'react';
import { ConnectionStatus, Conversation, Conversations, Insight, UserTier, Usage, ContextMenuState, ContextMenuItem, PendingInsightModification } from '../services/types';
import { AuthState } from '../services/supabase';
import { PWANavigationState } from '../services/pwaNavigationService';
// import type { Achievement } from '../services/dailyEngagementService';

export type ImageFile = { base64: string; mimeType: string; dataUrl: string };

export type FeedbackModalState = {
  isOpen: boolean;
  messageId?: string;
  insightId?: string;
  conversationId?: string;
  originalText?: string;
  type?: 'message' | 'insight';
};

export type ActiveModal = 'about' | 'privacy' | 'refund' | 'contact' | null;

export type OnboardingStatus = 'login' | 'initial' | 'features' | 'pro-features' | 'how-to-use' | 'tier-splash' | 'complete';

export interface AppState {
  // View and Navigation
  view: 'landing' | 'app';
  onboardingStatus: OnboardingStatus;
  activeSubView: string;
  
  // Modal States
  isConnectionModalOpen: boolean;
  isHandsFreeModalOpen: boolean;
  isCacheDashboardOpen: boolean;
  isCreditModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isAuthModalOpen: boolean;
  isOtakuDiaryModalOpen: boolean;
  isWishlistModalOpen: boolean;
  activeModal: ActiveModal;
  
  // Feature States
  hasRestored: boolean;
  isHandsFreeMode: boolean;
  isManualUploadMode: boolean;
  showUpgradeScreen: boolean;
  showDailyCheckin: boolean;
  showProactiveInsights: boolean;
  
  // Data States
  usage: Usage;
  imagesForReview: ImageFile[];
  otakuDiaryGameInfo: { id: string; title: string } | null;
  currentAchievement: any | null;
  
  // Authentication State
  authState: AuthState;
  pwaNavigationState: PWANavigationState;
  isOAuthCallback: boolean;
  
  // Interactivity State
  contextMenu: ContextMenuState | null;
  feedbackModalState: FeedbackModalState | null;
  chatInputValue: string;
  
  // Player Profile Setup State
  showProfileSetup: boolean;
  isFirstTime: boolean;
  
  // Enhanced Features State
  databaseSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastDatabaseSync: number;
  lastSuggestedPromptsShown: number;
}

export interface AppStateActions {
  // View and Navigation
  setView: (view: 'landing' | 'app') => void;
  setOnboardingStatus: (status: OnboardingStatus) => void;
  setActiveSubView: (subView: string) => void;
  
  // Modal States
  setIsConnectionModalOpen: (open: boolean) => void;
  setIsHandsFreeModalOpen: (open: boolean) => void;
  setIsCacheDashboardOpen: (open: boolean) => void;
  setIsCreditModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsOtakuDiaryModalOpen: (open: boolean) => void;
  setIsWishlistModalOpen: (open: boolean) => void;
  setActiveModal: (modal: ActiveModal) => void;
  
  // Feature States
  setHasRestored: (restored: boolean) => void;
  setIsHandsFreeMode: (mode: boolean) => void;
  setIsManualUploadMode: (mode: boolean) => void;
  setShowUpgradeScreen: (show: boolean) => void;
  setShowDailyCheckin: (show: boolean) => void;
  setShowProactiveInsights: (show: boolean) => void;
  
  // Data States
  setUsage: (usage: Usage) => void;
  setImagesForReview: (images: ImageFile[]) => void;
  setOtakuDiaryGameInfo: (info: { id: string; title: string } | null) => void;
  setCurrentAchievement: (achievement: any | null) => void;
  
  // Authentication State
  setAuthState: (state: AuthState) => void;
  setPwaNavigationState: (state: PWANavigationState) => void;
  setIsOAuthCallback: (callback: boolean) => void;
  
  // Interactivity State
  setContextMenu: (menu: ContextMenuState | null) => void;
  setFeedbackModalState: (state: FeedbackModalState | null) => void;
  setChatInputValue: (value: string) => void;
  
  // Player Profile Setup State
  setShowProfileSetup: (show: boolean) => void;
  setIsFirstTime: (firstTime: boolean) => void;
  
  // Enhanced Features State
  setDatabaseSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;
  setLastDatabaseSync: (timestamp: number) => void;
  setLastSuggestedPromptsShown: (timestamp: number) => void;
}

export const useAppState = (): AppState & AppStateActions => {
  // View and Navigation
  const [view, setView] = useState<'landing' | 'app'>('app');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(() => {
    const hasCompletedOnboarding = localStorage.getItem('otakonOnboardingComplete');
    return hasCompletedOnboarding ? 'complete' : 'login';
  });
  const [activeSubView, setActiveSubView] = useState('chat');
  
  // Modal States
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isHandsFreeModalOpen, setIsHandsFreeModalOpen] = useState(false);
  const [isCacheDashboardOpen, setIsCacheDashboardOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOtakuDiaryModalOpen, setIsOtakuDiaryModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  
  // Feature States
  const [hasRestored, setHasRestored] = useState(false);
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [isManualUploadMode, setIsManualUploadMode] = useState(false);
  const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
  const [showDailyCheckin, setShowDailyCheckin] = useState(false);
  const [showProactiveInsights, setShowProactiveInsights] = useState(false);
  
  // Data States
  const [usage, setUsage] = useState<Usage>({
    textCount: 0,
    imageCount: 0,
    textLimit: 55,
    imageLimit: 25,
    tier: 'free'
  });
  const [imagesForReview, setImagesForReview] = useState<ImageFile[]>([]);
  const [otakuDiaryGameInfo, setOtakuDiaryGameInfo] = useState<{ id: string; title: string } | null>(null);
  const [currentAchievement, setCurrentAchievement] = useState<any | null>(null);
  
  // Authentication State
  const [authState, setAuthState] = useState<AuthState>(() => {
    // This will be initialized by the auth service
    return { user: null, session: null, loading: true, error: null };
  });
  const [pwaNavigationState, setPwaNavigationState] = useState<PWANavigationState>(() => {
    // This will be initialized by the PWA navigation service
    return { 
      isPWA: false, 
      isInstalled: false, 
      canInstall: false,
      isPWAInstalled: false,
      isRunningInPWA: false,
      shouldShowLogin: false,
      shouldShowChat: false,
      isHandsFreeEnabled: false
    };
  });
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  
  // Interactivity State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [feedbackModalState, setFeedbackModalState] = useState<FeedbackModalState | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  
  // Player Profile Setup State
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(() => {
    // Default to true for first-time users, will be updated by Supabase check
    return true;
  });
  
  // Enhanced Features State
  const [databaseSyncStatus, setDatabaseSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastDatabaseSync, setLastDatabaseSync] = useState<number>(Date.now());
  const [lastSuggestedPromptsShown, setLastSuggestedPromptsShown] = useState<number>(0);

  return {
    // State
    view,
    onboardingStatus,
    activeSubView,
    isConnectionModalOpen,
    isHandsFreeModalOpen,
    isCacheDashboardOpen,
    isCreditModalOpen,
    isSettingsModalOpen,
    isAuthModalOpen,
    isOtakuDiaryModalOpen,
    isWishlistModalOpen,
    activeModal,
    hasRestored,
    isHandsFreeMode,
    isManualUploadMode,
    showUpgradeScreen,
    showDailyCheckin,
    showProactiveInsights,
    usage,
    imagesForReview,
    otakuDiaryGameInfo,
    currentAchievement,
    authState,
    pwaNavigationState,
    isOAuthCallback,
    contextMenu,
    feedbackModalState,
    chatInputValue,
    showProfileSetup,
    isFirstTime,
    databaseSyncStatus,
    lastDatabaseSync,
    lastSuggestedPromptsShown,
    
    // Actions
    setView,
    setOnboardingStatus,
    setActiveSubView,
    setIsConnectionModalOpen,
    setIsHandsFreeModalOpen,
    setIsCacheDashboardOpen,
    setIsCreditModalOpen,
    setIsSettingsModalOpen,
    setIsAuthModalOpen,
    setIsOtakuDiaryModalOpen,
    setIsWishlistModalOpen,
    setActiveModal,
    setHasRestored,
    setIsHandsFreeMode,
    setIsManualUploadMode,
    setShowUpgradeScreen,
    setShowDailyCheckin,
    setShowProactiveInsights,
    setUsage,
    setImagesForReview,
    setOtakuDiaryGameInfo,
    setCurrentAchievement,
    setAuthState,
    setPwaNavigationState,
    setIsOAuthCallback,
    setContextMenu,
    setFeedbackModalState,
    setChatInputValue,
    setShowProfileSetup,
    setIsFirstTime,
    setDatabaseSyncStatus,
    setLastDatabaseSync,
    setLastSuggestedPromptsShown,
  };
};
