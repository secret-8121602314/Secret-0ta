// User Types
export type UserTier = 'free' | 'pro' | 'vanguard_pro';
export type AuthMethod = 'google' | 'discord' | 'email';

// Connection Status
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface User {
  id: string;
  authUserId: string;
  email: string;
  tier: UserTier;
  hasProfileSetup: boolean;
  hasSeenSplashScreens: boolean;
  hasSeenHowToUse: boolean;
  hasSeenFeaturesConnected: boolean;
  hasSeenProFeatures: boolean;
  pcConnected: boolean;
  pcConnectionSkipped: boolean;
  onboardingCompleted: boolean;
  hasWelcomeMessage: boolean;
  isNewUser: boolean;
  hasUsedTrial: boolean;
  lastActivity: number;
  preferences: Record<string, any>;
  usage: Usage;
  appState: Record<string, any>;
  profileData: Record<string, any>;
  onboardingData: Record<string, any>;
  behaviorData: Record<string, any>;
  feedbackData: Record<string, any>;
  usageData: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Usage {
  textCount: number;
  imageCount: number;
  textLimit: number;
  imageLimit: number;
  totalRequests: number;
  lastReset: number;
  tier: UserTier;
}

// App State
export type AppView = 'landing' | 'app';
export type OnboardingStatus = 'login' | 'initial' | 'features' | 'pro-features' | 'how-to-use' | 'tier-splash' | 'complete';
export type ActiveModal = 'about' | 'privacy' | 'refund' | 'contact' | 'terms' | 'settings' | 'connection' | 'hands-free' | 'credit' | 'otaku-diary' | 'wishlist' | null;

export interface AppState {
  view: AppView;
  onboardingStatus: OnboardingStatus;
  activeSubView: string;
  isConnectionModalOpen: boolean;
  isHandsFreeModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isCreditModalOpen: boolean;
  isOtakuDiaryModalOpen: boolean;
  isWishlistModalOpen: boolean;
  activeModal: ActiveModal;
  isHandsFreeMode: boolean;
  showUpgradeScreen: boolean;
  showDailyCheckin: boolean;
  currentAchievement: any | null;
  loadingMessages: string[];
  isCooldownActive: boolean;
  isFirstTime: boolean;
  contextMenu: any | null;
  feedbackModalState: any | null;
  confirmationModal: any | null;
  trialEligibility: {
    isEligible: boolean;
    hasUsedTrial: boolean;
  } | null;
}

// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  gameId?: string;
  gameTitle?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface Conversations {
  [id: string]: Conversation;
}

// Game Types
export interface Game {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  platform?: string;
  releaseDate?: string;
  rating?: number;
  imageUrl?: string;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// Waitlist Types
export interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  createdAt: number;
  status: 'pending' | 'invited' | 'converted';
}

// Trial Types
export interface TrialStatus {
  isEligible: boolean;
  hasUsed: boolean;
  isActive: boolean;
  expiresAt?: number;
  daysRemaining?: number;
}

// Player Profile Types
export interface PlayerProfile {
  hintStyle: 'Cryptic' | 'Balanced' | 'Direct';
  playerFocus: 'Story-Driven' | 'Completionist' | 'Strategist';
  preferredTone: 'Encouraging' | 'Professional' | 'Casual';
  spoilerTolerance: 'Strict' | 'Moderate' | 'Relaxed';
}

// Auth Types
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  requiresConfirmation?: boolean;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
