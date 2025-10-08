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
  genre?: string;
  subtabs?: SubTab[];
  subtabsOrder?: string[];
  isActiveSession?: boolean;
  activeObjective?: string;
  gameProgress?: number;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  isPinned?: boolean;
  pinnedAt?: number;
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

// AI Types
export interface SubTab {
  id: string;
  title: string;
  content: string;
  type: 'chat' | 'walkthrough' | 'tips' | 'strategies' | 'story' | 'characters' | 'items';
  isNew: boolean;
  status: 'loading' | 'loaded' | 'error';
  instruction?: string;
}

export interface GameTab {
  id: string; // Will correspond to conversationId
  title: string;
  gameId: string; // From OTAKON tag
  gameTitle: string;
  genre: string;
  subtabs: SubTab[];
  createdAt: number;
  updatedAt: number;
  isActiveSession?: boolean;
}

export interface AIResponse {
  content: string; // The user-facing text
  suggestions: string[];
  otakonTags: Map<string, any>; // Parsed OTAKON tags
  rawContent: string; // Full response before stripping tags
  metadata: {
    model: string;
    timestamp: number;
    cost: number;
    tokens: number;
    fromCache?: boolean;
  };
}

export interface ActiveSessionState {
  isActive: boolean;
  currentGameId?: string; // Corresponds to conversation.id
}

// Configuration constants
export const newsPrompts: string[] = [
  "What's the latest gaming news?",
  "Which games are releasing soon?",
  "What are the latest game reviews?",
  "Show me the hottest new game trailers.",
];

export const insightTabsConfig: Record<string, Omit<SubTab, 'content' | 'isNew' | 'status'>[]> = {
  'Action RPG': [
    { id: 'walkthrough', title: 'Walkthrough', type: 'walkthrough', instruction: 'Provide a concise, step-by-step walkthrough for the current objective.' },
    { id: 'tips', title: 'Tips & Tricks', type: 'tips', instruction: 'Offer 3-5 non-obvious tips for the current game area or situation.' },
    { id: 'strategies', title: 'Combat Strategies', type: 'strategies', instruction: 'Detail a strategy for defeating a specific enemy or boss.' },
    { id: 'story', title: 'Story So Far', type: 'story', instruction: 'Summarize the story up to the current point, avoiding future spoilers.' },
    { id: 'characters', title: 'Characters', type: 'characters', instruction: 'Provide a brief on a key character the player just met.' },
    { id: 'items', title: 'Items & Equipment', type: 'items', instruction: 'Describe a recently acquired item or piece of equipment and its use.' },
  ],
  'RPG': [
    { id: 'walkthrough', title: 'Walkthrough', type: 'walkthrough', instruction: 'Provide a step-by-step guide for the current quest or objective.' },
    { id: 'tips', title: 'Tips & Tricks', type: 'tips', instruction: 'Offer helpful tips for character building and progression.' },
    { id: 'strategies', title: 'Combat Strategies', type: 'strategies', instruction: 'Detail combat strategies and party composition advice.' },
    { id: 'story', title: 'Story So Far', type: 'story', instruction: 'Summarize the story up to the current point, avoiding future spoilers.' },
    { id: 'characters', title: 'Characters', type: 'characters', instruction: 'Provide information about key characters and NPCs.' },
    { id: 'items', title: 'Items & Equipment', type: 'items', instruction: 'Describe important items, weapons, and equipment.' },
  ],
  'FPS': [
    { id: 'walkthrough', title: 'Walkthrough', type: 'walkthrough', instruction: 'Provide tactical guidance for the current mission or level.' },
    { id: 'tips', title: 'Tips & Tricks', type: 'tips', instruction: 'Offer combat tips and weapon recommendations.' },
    { id: 'strategies', title: 'Strategies', type: 'strategies', instruction: 'Detail tactical approaches for different combat situations.' },
    { id: 'story', title: 'Story So Far', type: 'story', instruction: 'Summarize the story up to the current point, avoiding future spoilers.' },
    { id: 'characters', title: 'Characters', type: 'characters', instruction: 'Provide information about key characters and allies.' },
    { id: 'items', title: 'Weapons & Equipment', type: 'items', instruction: 'Describe weapons, equipment, and their tactical uses.' },
  ],
  'Strategy': [
    { id: 'walkthrough', title: 'Walkthrough', type: 'walkthrough', instruction: 'Provide strategic guidance for the current scenario or mission.' },
    { id: 'tips', title: 'Tips & Tricks', type: 'tips', instruction: 'Offer resource management and tactical tips.' },
    { id: 'strategies', title: 'Strategies', type: 'strategies', instruction: 'Detail strategic approaches for different scenarios.' },
    { id: 'story', title: 'Story So Far', type: 'story', instruction: 'Summarize the story up to the current point, avoiding future spoilers.' },
    { id: 'characters', title: 'Characters', type: 'characters', instruction: 'Provide information about key characters and leaders.' },
    { id: 'items', title: 'Resources & Units', type: 'items', instruction: 'Describe important resources, units, and technologies.' },
  ],
  'Puzzle': [
    { id: 'walkthrough', title: 'Walkthrough', type: 'walkthrough', instruction: 'Provide step-by-step solution for the current puzzle.' },
    { id: 'tips', title: 'Tips & Tricks', type: 'tips', instruction: 'Offer puzzle-solving strategies and techniques.' },
    { id: 'strategies', title: 'Strategies', type: 'strategies', instruction: 'Detail approaches for different types of puzzles.' },
    { id: 'story', title: 'Story So Far', type: 'story', instruction: 'Summarize the story up to the current point, avoiding future spoilers.' },
    { id: 'characters', title: 'Characters', type: 'characters', instruction: 'Provide information about key characters and their roles.' },
    { id: 'items', title: 'Items & Tools', type: 'items', instruction: 'Describe important items and tools for puzzle solving.' },
  ],
  'Default': [
    { id: 'walkthrough', title: 'Walkthrough', type: 'walkthrough', instruction: 'Provide a step-by-step guide for the current objective.' },
    { id: 'tips', title: 'Tips', type: 'tips', instruction: 'Give some helpful tips for the game.' },
  ]
};
