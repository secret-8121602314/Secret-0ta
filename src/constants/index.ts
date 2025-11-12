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

export const TIER_FEATURES = {
  [USER_TIERS.FREE]: [
    '55 text queries per month',
    '25 image queries per month',
    'Basic conversation features',
    'Standard response quality'
  ],
  [USER_TIERS.PRO]: [
    '1,583 text queries per month',
    '328 image queries per month',
    'Enhanced conversation features',
    'Improved response quality',
    'Priority support',
    'No ads',
    'Grounding search enabled'
  ],
  [USER_TIERS.VANGUARD_PRO]: [
    '1,583 text queries per month',
    '328 image queries per month',
    'All Pro features',
    'Exclusive Vanguard content',
    'VIP support',
    'Early access to new features',
    'Grounding search enabled'
  ],
} as const;

export const TIER_PRICES = {
  [USER_TIERS.FREE]: undefined,
  [USER_TIERS.PRO]: 3.99,
  [USER_TIERS.VANGUARD_PRO]: 20.00,
} as const;

export const STORAGE_KEYS = {
  USER: 'otakon_user',
  APP_STATE: 'otakon_app_state',
  CONVERSATIONS: 'otakon_conversations',
  GAMES: 'otakon_games',
  WAITLIST: 'otakon_waitlist',
  USAGE: 'otakon_usage',
  PREFERENCES: 'otakon_preferences',
  ONBOARDING: 'otakon_onboarding',
  TRIAL: 'otakon_trial',
} as const;

export const GAME_HUB_ID = 'game-hub';
export const DEFAULT_CONVERSATION_TITLE = 'Game Hub';

// Feature Flags
export const FEATURE_FLAGS = {
  // ⚠️ Set to true to use normalized messages table instead of conversations.messages JSONB
  // This enables better performance, pagination, and message search capabilities
  USE_NORMALIZED_MESSAGES: true,
  
  // ⚠️ Set to true to use normalized subtabs table instead of conversations.subtabs JSONB
  // This enables better performance, pagination, and subtab search capabilities
  USE_NORMALIZED_SUBTABS: true,
  
  // Enable context summarization for conversations
  USE_CONTEXT_SUMMARIZATION: true,
  
  // Enable conversation slugs for human-readable URLs
  USE_CONVERSATION_SLUGS: true,
} as const;
