/**
 * Application-wide constants
 * 
 * This file consolidates all constants used throughout the application
 * to improve maintainability and reduce magic numbers/strings.
 */

// ============================================================================
// AUDIO & MEDIA
// ============================================================================

export const SILENT_AUDIO_URL = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

// ============================================================================
// TIMING & DELAYS
// ============================================================================

export const TIMING = {
  // OAuth callback delay
  OAUTH_CALLBACK_DELAY: 2000,
  
  // Stop cooldown
  STOP_COOLDOWN_MS: 2000,
  
  // Usage refresh delay
  USAGE_REFRESH_DELAY: 150,
  
  // Default retry delays
  RETRY_DELAY_BASE: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  
  // Cache expiration
  CACHE_EXPIRATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  
  // Welcome message cooldown
  WELCOME_MESSAGE_COOLDOWN_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  // Authentication
  AUTH_METHOD: 'otakonAuthMethod',
  
  // Onboarding
  ONBOARDING_COMPLETE: 'otakonOnboardingComplete',
  PROFILE_SETUP_COMPLETED: 'otakon_profile_setup_completed',
  FIRST_RUN_COMPLETED: 'otakon_first_run_completed',
  
  // Welcome messages
  WELCOME_MESSAGE_SHOWN: 'otakon_welcome_message_shown',
  LAST_WELCOME_TIME: 'otakon_last_welcome_time',
  FIRST_WELCOME_SHOWN: 'otakon_first_welcome_shown',
  
  // App state
  APP_CLOSED_TIME: 'otakon_app_closed_time',
  HAS_CONVERSATIONS: 'otakon_has_conversations',
  HAS_INTERACTED_WITH_CHAT: 'otakon_has_interacted_with_chat',
  HAS_CONNECTED_BEFORE: 'otakonHasConnectedBefore',
  INSTALL_DISMISSED: 'otakonInstallDismissed',
  
  // Tutorial
  TUTORIAL_COMPLETED: 'otakon_tutorial_completed',
  
  // Connection
  LAST_CONNECTION_CODE: 'lastConnectionCode',
  
  // Usage tracking
  USER_TIER: 'otakonUserTier',
  TEXT_COUNT: 'otakonTextQueryCount',
  IMAGE_COUNT: 'otakonImageQueryCount',
  LAST_USAGE_DATE: 'otakonLastUsageDate',
  
  // Cache
  APP_CACHE_PREFIX: 'otakon_app_cache_',
  USER_PREFERENCES: 'otakon_user_preferences',
  
  // Tasks
  TASKS_PREFIX: 'otakon_tasks_',
  FAVORITES_PREFIX: 'otakon_favorites_',
} as const;

// ============================================================================
// USER TIERS & LIMITS
// ============================================================================

export const USER_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  VANGUARD_PRO: 'vanguard_pro',
} as const;

export const TIER_LIMITS = {
  [USER_TIERS.FREE]: { text: 55, image: 25 },
  [USER_TIERS.PRO]: { text: 1583, image: 328 },
  [USER_TIERS.VANGUARD_PRO]: { text: 1583, image: 328 },
} as const;

// ============================================================================
// GEMINI MODELS
// ============================================================================

export const GEMINI_MODELS = {
  PRO: 'gemini-2.5-pro',
  FLASH: 'gemini-2.5-flash',
} as const;

// ============================================================================
// CONNECTION STATUS
// ============================================================================

export const CONNECTION_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
} as const;

// ============================================================================
// ONBOARDING STATUS
// ============================================================================

export const ONBOARDING_STATUS = {
  LOGIN: 'login',
  INITIAL: 'initial',
  FEATURES: 'features',
  PRO_FEATURES: 'pro-features',
  HOW_TO_USE: 'how-to-use',
  TIER_SPLASH: 'tier-splash',
  COMPLETE: 'complete',
} as const;

// ============================================================================
// MODAL TYPES
// ============================================================================

export const MODAL_TYPES = {
  ABOUT: 'about',
  PRIVACY: 'privacy',
  REFUND: 'refund',
  CONTACT: 'contact',
} as const;

// ============================================================================
// DATABASE SYNC STATUS
// ============================================================================

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// ============================================================================
// FEEDBACK TYPES
// ============================================================================

export const FEEDBACK_TYPES = {
  MESSAGE: 'message',
  INSIGHT: 'insight',
} as const;

export const FEEDBACK_VOTES = {
  UP: 'up',
  DOWN: 'down',
  SUBMITTED: 'submitted',
} as const;

// ============================================================================
// CONTENT TYPES
// ============================================================================

export const CONTENT_TYPES = {
  GAME_HELP: 'game_help',
  INSIGHT: 'insight',
  TASK: 'task',
  GAME_INFO: 'game_info',
  GENERAL: 'general',
  UNRELEASED_GAME: 'unreleased_game',
} as const;

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

export const RESPONSE_TONES = {
  CASUAL: 'casual',
  FORMAL: 'formal',
  ENCOURAGING: 'encouraging',
  TECHNICAL: 'technical',
} as const;

// ============================================================================
// USER INTENT TYPES
// ============================================================================

export const USER_INTENT = {
  NEW_HELP: 'new_help',
  CLARIFICATION: 'clarification',
  FOLLOW_UP: 'follow_up',
  GAME_SWITCH: 'game_switch',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  SUPABASE_AUTH: '/auth/v1/user',
  SUPABASE_REST: '/rest/v1',
  GEMINI_API: 'https://generativelanguage.googleapis.com/v1beta',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  NETWORK_ERROR: 'Network error occurred',
  DATABASE_ERROR: 'Database operation failed',
  CACHE_ERROR: 'Cache operation failed',
  VALIDATION_ERROR: 'Validation failed',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  DATA_SYNCED: 'Data synced successfully',
  CACHE_CLEARED: 'Cache cleared successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
  // Breakpoints
  BREAKPOINTS: {
    TINY: 480,
    SMALL: 640,
    MEDIUM: 768,
    LARGE: 1024,
    XLARGE: 1280,
  },
  
  // Animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Z-index layers
  Z_INDEX: {
    MODAL: 1000,
    DROPDOWN: 100,
    TOOLTIP: 200,
    NOTIFICATION: 1500,
  },
} as const;
