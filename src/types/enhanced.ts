/**
 * Enhanced Type Definitions
 * Replaces all `any` types with proper TypeScript interfaces
 */

// ============================================================================
// User Data Types
// ============================================================================

/**
 * User preferences stored in JSONB field
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  soundEnabled?: boolean;
  ttsVoice?: string;
  ttsSpeed?: number;
  ttsEnabled?: boolean;
  messageAnimations?: boolean;
  autoScroll?: boolean;
  compactMode?: boolean;
  showTimestamps?: boolean;
  language?: string;
  [key: string]: unknown; // Allow additional preferences
}

/**
 * User profile data (Player Profile)
 */
export interface UserProfileData {
  hintStyle?: 'Cryptic' | 'Balanced' | 'Direct';
  playerFocus?: 'Story-Driven' | 'Completionist' | 'Strategist';
  preferredTone?: 'Encouraging' | 'Professional' | 'Casual';
  spoilerTolerance?: 'Strict' | 'Moderate' | 'Relaxed';
  displayName?: string;
  avatar?: string;
  bio?: string;
  favoriteGenres?: string[];
  gamingStartYear?: number; // Gaming Explorer onboarding - when user started gaming
  [key: string]: unknown;
}

/**
 * Application state stored in user record
 */
export interface UserAppState {
  lastConversationId?: string;
  lastGameId?: string;
  activeView?: string;
  sidebarCollapsed?: boolean;
  recentGames?: string[];
  pinnedConversations?: string[];
  [key: string]: unknown;
}

/**
 * Onboarding progress data
 */
export interface UserOnboardingData {
  currentStep?: string;
  completedSteps?: string[];
  skippedSteps?: string[];
  startedAt?: number;
  completedAt?: number;
  [key: string]: unknown;
}

/**
 * User behavior tracking data
 */
export interface UserBehaviorData {
  totalSessions?: number;
  averageSessionDuration?: number;
  lastSessionStart?: number;
  lastSessionEnd?: number;
  featureUsage?: Record<string, number>;
  clickstream?: Array<{
    action: string;
    timestamp: number;
    context?: string;
  }>;
  [key: string]: unknown;
}

/**
 * User feedback data
 */
export interface UserFeedbackData {
  ratings?: Array<{
    feature: string;
    rating: number;
    comment?: string;
    timestamp: number;
  }>;
  reportedIssues?: Array<{
    type: string;
    description: string;
    timestamp: number;
  }>;
  suggestions?: string[];
  [key: string]: unknown;
}

/**
 * Usage statistics and analytics
 */
export interface UserUsageData {
  dailyStats?: Record<string, {
    textQueries: number;
    imageQueries: number;
    conversations: number;
  }>;
  weeklyStats?: Record<string, {
    textQueries: number;
    imageQueries: number;
    conversations: number;
  }>;
  monthlyStats?: Record<string, {
    textQueries: number;
    imageQueries: number;
    conversations: number;
  }>;
  [key: string]: unknown;
}

// ============================================================================
// Connection & Device Types
// ============================================================================

/**
 * PC device information for connections
 */
export interface ConnectionDeviceInfo {
  deviceName?: string;
  deviceType?: 'desktop' | 'laptop';
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  screenResolution?: string;
  userAgent?: string;
  [key: string]: unknown;
}

// ============================================================================
// Message & Conversation Types
// ============================================================================

/**
 * Message object structure used in conversations
 */
export interface MessageObject {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  imageUrl?: string;
  metadata?: MessageMetadata;
  suggestedPrompts?: string[]; // AI-generated follow-up prompts for this message
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  model?: string;
  tokens?: number;
  cost?: number;
  fromCache?: boolean;
  regenerated?: boolean;
  edited?: boolean;
  otakonTags?: Record<string, unknown>;
  suggestedPrompts?: string[]; // Store AI-generated follow-up prompts in metadata for database persistence
  [key: string]: unknown;
}

/**
 * Subtab metadata stored in JSONB
 */
export interface SubtabMetadata {
  generatedBy?: string;
  generatedAt?: number;
  lastModified?: number;
  version?: number;
  sources?: string[];
  confidence?: number;
  [key: string]: unknown;
}

/**
 * Game metadata stored in JSONB
 */
export interface GameMetadata {
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  lastPlayed?: number;
  achievements?: Array<{
    id: string;
    name: string;
    unlocked: boolean;
    unlockedAt?: number;
  }>;
  customFields?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

// ============================================================================
// AI Cache Types
// ============================================================================

/**
 * AI cache context for generating cache keys
 */
export interface AICacheContext {
  userId?: string;
  gameId?: string;
  conversationId?: string;
  promptType?: string;
  gameTitle?: string;
  genre?: string;
  [key: string]: unknown;
}

/**
 * AI response data that can be cached
 */
export interface AICacheResponseData {
  content: string;
  suggestions?: string[];
  followUpPrompts?: string[];
  metadata?: {
    model: string;
    timestamp: number;
    cost: number;
    tokens: number;
  };
  otakonTags?: Record<string, unknown>;
  [key: string]: unknown;
}

// ============================================================================
// Browser API Extensions
// ============================================================================

/**
 * Extended Navigator interface for PWA features
 */
export interface ExtendedNavigator {
  standalone?: boolean;
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>;
  };
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Network Information API
 */
export interface NetworkInformation extends EventTarget {
  readonly effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  readonly downlink: number;
  readonly rtt: number;
  readonly saveData: boolean;
  onchange: ((this: NetworkInformation, ev: Event) => unknown) | null;
}

/**
 * Wake Lock Sentinel
 */
export interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => unknown) | null;
}

/**
 * Extended Performance interface with memory API
 */
export interface ExtendedPerformance extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

/**
 * Extended Window interface
 */
export interface ExtendedWindow extends Window {
  gc?: () => void;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Vite import.meta environment
 */
export interface ViteImportMeta {
  env: {
    DEV: boolean;
    PROD: boolean;
    BASE_URL: string;
    MODE: string;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    VITE_GEMINI_API_KEY?: string;
    [key: string]: unknown;
  };
  url: string;
  hot?: {
    accept: () => void;
    dispose: (cb: () => void) => void;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic update data for partial updates
 */
export type UpdateData<T = unknown> = Record<string, T>;

/**
 * JSON-compatible value types
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

/**
 * Type guard to check if a value is a JsonObject
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a JsonArray
 */
export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

// ============================================================================
// PWA Types
// ============================================================================

/**
 * BeforeInstallPromptEvent interface
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
