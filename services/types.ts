export interface TaskCompletionPrompt {
  id: string;
  tasks: DiaryTask[];
  promptText: string;
  timestamp: number;
  conversationId: string;
  userTier: 'free' | 'pro' | 'vanguard_pro';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
  reward?: string;
}

export interface OnboardingFunnelStats {
  stepName: string;
  stepOrder: number;
  totalUsers: number;
  completedUsers: number;
  droppedOffUsers: number;
  completionRate: number;
  avgDurationMs: number;
}

export interface TierConversionStats {
  fromTier: string;
  toTier: string;
  totalAttempts: number;
  successfulUpgrades: number;
  conversionRate: number;
  avgAmount: number;
}

export interface FeatureUsageStats {
  featureName: string;
  featureCategory: string;
  totalUsers: number;
  totalUsageCount: number;
  avgUsagePerUser: number;
  mostActiveUsers: number;
}

export interface GameProgress {
  current_progress_level: number;
  game_version: string;
  completed_events: string[];
  progress_metadata: any;
  last_progress_update: string;
  progress_confidence: number;
}

export interface GameEvent {
  id: string;
  game_id: string;
  game_version: string;
  event_id: string;
  event_type: string;
  description: string;
  unlocks_progress_level: number;
  lore_context?: string;
  difficulty_rating: number;
}

export interface ProgressHistory {
  id: string;
  user_id: string;
  game_id: string;
  game_version: string;
  event_id: string;
  old_level: number;
  new_level: number;
  ai_confidence: number;
  ai_reasoning: string;
  ai_evidence: string[];
  user_feedback: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  gameName: string;
  releaseDate?: string; // ISO date string
  platform?: string;
  genre?: string;
  description?: string;
  addedAt: number;
  gameId: string; // 'everything-else' for wishlist items
  source?: string; // AI response or user input
  sourceMessageId?: string; // Link to original message
  isReleased?: boolean; // Track if game has been released
  releaseNotificationShown?: boolean; // Track if notification has been shown
  lastChecked?: number; // Last time release status was checked
}

// AI detected task interface (moved from unifiedAIService to break circular dependency)
export interface DetectedTask {
  title: string;
  description: string;
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  confidence: number;
  source: string;
}

// Additional missing types
export interface Usage {
  textQueries: number;
  imageQueries: number;
  insights: number;
  textCount: number;
  imageCount: number;
  textLimit: number;
  imageLimit: number;
  tier: UserTier;
}

export interface OnboardingStep {
  stepName: string;
  stepOrder: number;
  completionTime?: number;
  skipped?: boolean;
  startTime?: number;
  metadata?: Record<string, any>;
}

export interface TierUpgradeAttempt {
  fromTier: string;
  toTier: string;
  timestamp: number;
  success: boolean;
  reason?: string;
  attemptSource?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export interface FeatureUsageEvent {
  featureName: string;
  action: string;
  timestamp: number;
  metadata?: Record<string, any>;
  featureCategory?: string;
}

export interface CacheStrategy {
  name: string;
  description: string;
  enabled: boolean;
  ttl?: number;
  priority?: number;
  maxSize?: number;
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  totalRequests: number;
  memoryUsage?: number;
  storageUsage?: number;
  lastUpdated: Date;
}
export interface DiaryTask {
  id: string;
  title: string;
  description: string;
  type: 'user_created' | 'ai_suggested';
  status: 'pending' | 'completed' | 'need_help';
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  createdAt: number;
  completedAt?: number;
  gameId: string;
  source?: string; // AI response or user input
  priority?: 'low' | 'medium' | 'high';
  sourceMessageId?: string; // Link to original message/insight
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export type ImageFile = {
  id: string;
  file: File | null;
  preview: string;
  name: string;
  size: number;
  type: string;
  base64: string;
  mimeType: string;
  dataUrl: string;
};

export type ChatMessageFeedback = 'up' | 'down' | 'submitted';

export type ChatMessage = {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  images?: string[]; // data URLs for displaying images in chat
  isFromPC?: boolean;
  sources?: { uri: string; title: string; }[];
  suggestions?: string[];
  triumph?: { type: string; name: string; };
  showUpgradeButton?: boolean;
  feedback?: ChatMessageFeedback;
  taskCompletionPrompt?: TaskCompletionPrompt; // NEW: Task completion prompt
};

export type UserTier = 'free' | 'pro' | 'vanguard_pro';

// Usage type removed - using interface instead

export type InsightStatus = 'loading' | 'streaming' | 'loaded' | 'error' | 'placeholder';

export type Insight = {
  id: string;
  title: string;
  content: string;
  status: InsightStatus;
  isNew?: boolean;
  feedback?: ChatMessageFeedback;
  isPlaceholder?: boolean; // New flag for placeholder content
  lastUpdated?: number; // Track when content was last updated
  generationAttempts?: number; // Track generation attempts for retry logic
};

export type GeminiModel = 'gemini-2.5-pro' | 'gemini-2.5-flash';

export const GEMINI_PRO_MODEL: GeminiModel = 'gemini-2.5-pro';
export const GEMINI_FLASH_MODEL: GeminiModel = 'gemini-2.5-flash';

export type PendingInsightModification = {
  id: string; // The ID of the insight to modify/overwrite
  type: 'add' | 'remove' | 'modify';
  title?: string;
  content?: string;
  status?: InsightStatus;
};

// New simplified tab management types
export type TabCommand = TabModificationCommand | TabDeletionCommand;

export type TabActionType = 'add' | 'modify' | 'delete' | 'reorder';

export type TabModificationCommand = {
  action: 'add' | 'modify';
  tabId?: string; // Required for modify, optional for add
  title: string;
  content?: string;
  position?: number; // For reordering
};

export type TabDeletionCommand = {
  action: 'delete';
  tabId: string;
  confirmation?: boolean; // For safety
};

export type TabCommandResult = {
  success: boolean;
  message: string;
  updatedTabs?: string[];
  error?: string;
};

export type ContextMenuItem = {
  label: string;
  action: () => void;
  icon?: React.FC<{ className?: string }>;
  isDestructive?: boolean;
};

export type ContextMenuState = {
  targetRect: DOMRect;
  items: ContextMenuItem[];
};

export type Conversation = {
  id:string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  progress?: number;
  inventory?: string[];
  lastTrailerTimestamp?: number;
  lastInteractionTimestamp?: number;
  genre?: string;
  insights?: Record<string, Insight>;
  insightsOrder?: string[];
  isPinned?: boolean;
  activeObjective?: { description: string; isCompleted: boolean; } | null;
  // Legacy properties for backward compatibility
  gameId?: string;
  game_id?: string;
  lastModified?: number;
  context?: any;
  version?: number;
};

export type Conversations = Record<string, Conversation>;

export const newsPrompts = [
    "What's the latest gaming news?",
    "Which games are releasing soon?",
    "What are the latest game reviews?",
    "Show me the hottest new game trailers.",
];

const storySoFarTab: InsightTab = { id: 'story_so_far', title: 'Story So Far', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." };

export const insightTabsConfig: Record<string, InsightTab[]> = {
    'default': [
        storySoFarTab,
        { id: 'missed_items', title: 'Items You May Have Missed', instruction: "Based on the player's current progress, identify 2-3 significant items, secrets, or side quests they might have overlooked in areas they have already visited. Provide clear, actionable hints about their locations without giving away the exact solution. Use landmarks and environmental descriptions. Example: 'In the Whispering Caverns, a waterfall hides more than just a damp cave wall.'" },
        { id: 'game_lore', title: 'Relevant Lore', instruction: "Provide a fascinating, detailed, spoiler-free piece of lore about the game's world, characters, or backstory that is relevant to the player's current situation or recent events. This should be a deep-dive, not a short summary." },
        { id: 'build_guide', title: 'Build Guide', instruction: "Suggest one or two detailed, effective character builds or loadouts using items and skills available up to the current progress point. Be specific about the synergy between components, stat allocation, and how the build excels in the player's current or upcoming challenges." },
        { id: 'next_session_plan', title: 'Plan Your Next Session', instruction: "Based on the player's progress and story so far, clearly list 3-4 concrete objectives or tasks they can tackle in their next gameplay session. This should include a mix of main quests, important side quests, and interesting areas to explore next. Provide a brief, compelling reason for each suggestion." },
    ],
    'Action RPG': [
        storySoFarTab,
        { id: 'quest_log', title: 'Active Quests', instruction: "Summarize the active main quest and suggest 2-3 relevant side quests available in the current area. Explain the potential rewards or story connections." },
        { id: 'build_optimization', title: 'Build Optimization', instruction: "Analyze the player's likely stats and gear. Suggest 2-3 specific improvements, like stat allocation changes, better weapon affinities, or spells that synergize with their build." },
        { id: 'boss_strategy', title: 'Upcoming Boss Strategy', instruction: "A significant challenge may lie ahead. **Do not name the upcoming boss or describe its appearance.** Instead, provide clear, actionable tactical advice based on its likely attack patterns and weaknesses. Suggest effective weapon types, armor properties, status effects, and specific strategies (e.g., 'This foe is relentless up close; focus on ranged attacks and stay mobile,' or 'Its armor is vulnerable to fire damage; enchanted weapons will be key.'). The advice should be practical, not metaphorical." },
        { id: 'hidden_paths', title: 'Hidden Paths & Secrets', instruction: "Hint at a secret path or hidden area nearby that the player may have missed. **Do not give explicit directions.** Instead, provide a clear clue tied to a specific landmark or environmental feature. The goal is to make the player think 'Aha!' not 'Huh?'. Example: 'The large statue in the Grand Hall seems to be pointing at a specific tapestry on the wall...' or 'Listen for the sound of running water behind the library's northern bookshelf.'" },
    ],
    'First-Person Shooter': [
        storySoFarTab,
        { id: 'loadout_analysis', title: 'Loadout Analysis', instruction: "Analyze the probable current weapon loadout. Suggest 2 alternative, powerful loadouts (primary, secondary, equipment) for the current situation or map, explaining the strategic advantage of each." },
        { id: 'map_strategies', title: 'Map Strategies', instruction: "Provide 3 key strategic tips for the likely current map or area, focusing on positioning, flanking routes, and objective control." },
        { id: 'enemy_intel', title: 'Enemy Intel', instruction: "You'll encounter new threats in this zone. **Do not name the enemy types or describe their appearance in a way that spoils their reveal.** Describe their behavior, attack patterns, and a key vulnerability in a tactical, in-universe way. The advice must be actionable. For example: 'Some hostiles carry volatile canisters on their backs. A well-placed shot could trigger a chain reaction.' or 'Listen for a high-pitched whine; it signals a devastating charge you must evade immediately.'" },
        { id: 'pro_tips', title: 'Pro Tips', instruction: "Offer 3 advanced tips or 'pro strats' for this game that a new player might not know, such as movement tricks, ability combos, or unusual weapon uses." },
    ],
     'Strategy': [
        storySoFarTab,
        { id: 'current_board_state', title: 'Current State Analysis', instruction: "Analyze the current game state (e.g., board position, resources, army composition). Provide a high-level summary of strengths, weaknesses, and immediate threats." },
        { id: 'opening_moves', title: 'Opening Builds', instruction: "Describe 2-3 popular and effective opening strategies or build orders for the player's faction or starting position." },
        { id: 'unit_counters', title: 'Unit Counters', instruction: "Intelligence suggests the enemy will deploy units with specific strengths. **Do not name the enemy units.** Instead, describe their function (e.g., 'fast-moving aerial threats', 'heavily armored ground forces') and suggest specific, effective counters from the player's available arsenal. Explain *why* the counter works (e.g., '...because your Stinger units have tracking projectiles that are effective against agile air targets.')." },
        { id: 'economy_guide', title: 'Economy Management', instruction: "Provide 3 tips for optimizing resource generation and spending at the player's current stage of the game." },
    ],
    'Simulation': [
        { id: 'goal_suggestions', title: 'Goal Suggestions', instruction: "Based on the current state, suggest 3 short-term and 1 long-term goal to work towards. For example, expanding a facility, achieving a milestone, or unlocking a new technology." },
        { id: 'efficiency_tips', title: 'Efficiency & Optimization', instruction: "Provide 3 actionable tips for improving the efficiency of the player's current setup, such as optimizing a production line, improving traffic flow, or managing finances better." },
        { id: 'hidden_mechanics', title: 'Hidden Mechanics', instruction: "Explain one non-obvious game mechanic that can significantly impact gameplay, which the player may not be aware of yet." },
        { id: 'disaster_prep', title: 'Disaster Prep', instruction: "Great endeavors are often tested. **Do not name the specific disaster or event.** Hint at a potential future challenge in a thematic way and suggest 2-3 concrete, preventative measures. For example: 'The markets are fickle; diversifying your income streams and building a cash reserve can weather any financial storm.' or 'The earth sometimes trembles. Ensuring your infrastructure is reinforced near fault lines could prevent a catastrophe.'" },
    ],
    'Sports': [
        storySoFarTab,
        { id: 'team_management', title: 'Team Management', instruction: "Analyze the current team composition and suggest 2-3 strategic improvements. Consider player stats, chemistry, formation adjustments, or tactical changes that could enhance performance based on the current season progress." },
        { id: 'training_focus', title: 'Training Focus', instruction: "Based on the current team's strengths and weaknesses, recommend specific training priorities. Suggest which players need development, what skills to focus on, and how to prepare for upcoming challenges." },
        { id: 'tactical_analysis', title: 'Tactical Analysis', instruction: "Provide detailed tactical advice for the current situation. This could include formation strategies, player positioning, set-piece tactics, or counter-strategies against specific opponents you've faced or are about to face." },
        { id: 'season_progression', title: 'Season Progression', instruction: "Outline the key objectives and milestones for the current season phase. Suggest realistic goals, important matches to focus on, and strategic decisions that could impact the team's long-term success." },
    ],
    'Multiplayer Shooter': [
        storySoFarTab,
        { id: 'meta_analysis', title: 'Meta Analysis', instruction: "Analyze the current meta and suggest 2-3 effective loadouts or strategies. Consider weapon balance, map-specific tactics, and counter-strategies against popular playstyles in the current meta." },
        { id: 'team_coordination', title: 'Team Coordination', instruction: "Provide advanced team play strategies. Suggest communication tactics, role assignments, positioning strategies, and how to counter common enemy team compositions or strategies." },
        { id: 'map_control', title: 'Map Control', instruction: "Offer detailed map control strategies for the current or upcoming maps. Include key positions, rotation paths, objective control tactics, and how to maintain map dominance." },
        { id: 'skill_development', title: 'Skill Development', instruction: "Identify specific skills to improve based on current performance. Suggest aim training routines, movement techniques, game sense improvements, or mechanical skills that could elevate gameplay." },
    ],
    'Multiplayer Sports': [
        storySoFarTab,
        { id: 'competitive_strategy', title: 'Competitive Strategy', instruction: "Analyze the competitive landscape and suggest strategies for ranked/competitive play. Consider meta shifts, opponent tendencies, and advanced tactics that separate good players from great ones." },
        { id: 'team_synergy', title: 'Team Synergy', instruction: "Provide advice on building effective team compositions and strategies. Suggest player combinations, communication protocols, and how to maximize team chemistry and coordination." },
        { id: 'performance_optimization', title: 'Performance Optimization', instruction: "Offer specific tips for improving individual and team performance. Include practice routines, skill development priorities, and how to adapt to different opponents and playstyles." },
        { id: 'ranked_progression', title: 'Ranked Progression', instruction: "Outline a strategic approach to climbing ranks. Suggest focus areas, common mistakes to avoid, and how to maintain consistency in competitive matches." },
    ],
    'Racing': [
        storySoFarTab,
        { id: 'vehicle_tuning', title: 'Vehicle Tuning', instruction: "Analyze the current vehicle setup and suggest tuning adjustments. Consider track characteristics, weather conditions, and racing style to recommend optimal configurations for current or upcoming races." },
        { id: 'track_strategy', title: 'Track Strategy', instruction: "Provide detailed racing strategies for current or upcoming tracks. Include braking points, racing lines, overtaking opportunities, and how to handle specific track sections or challenges." },
        { id: 'race_craft', title: 'Race Craft', instruction: "Offer advanced racing techniques and strategies. Include defensive driving, overtaking tactics, pit stop strategies, and how to manage tire wear and fuel consumption effectively." },
        { id: 'championship_focus', title: 'Championship Focus', instruction: "Outline strategic priorities for the current championship or season. Suggest which races to focus on, points management strategies, and how to maximize championship potential." },
    ],
    'Fighting': [
        storySoFarTab,
        { id: 'character_analysis', title: 'Character Analysis', instruction: "Analyze the current character's strengths, weaknesses, and optimal playstyle. Suggest advanced techniques, combo routes, and how to maximize the character's potential in different matchups." },
        { id: 'matchup_strategy', title: 'Matchup Strategy', instruction: "Provide detailed matchup strategies against common opponents. Include character-specific tactics, counter-strategies, and how to exploit opponent weaknesses while covering your own." },
        { id: 'execution_training', title: 'Execution Training', instruction: "Suggest specific training routines to improve execution and consistency. Include combo practice, timing drills, and techniques to master difficult inputs or advanced mechanics." },
        { id: 'tournament_prep', title: 'Tournament Prep', instruction: "Outline preparation strategies for competitive play. Include mental preparation, warm-up routines, and how to maintain peak performance during extended tournament sessions." },
    ],
    'Battle Royale': [
        storySoFarTab,
        { id: 'drop_strategy', title: 'Drop Strategy', instruction: "Analyze optimal landing locations and early-game strategies. Consider loot quality, player density, and how to maximize survival chances while securing good equipment for the mid-game." },
        { id: 'positioning_tactics', title: 'Positioning Tactics', instruction: "Provide advanced positioning strategies for different phases of the match. Include rotation timing, zone management, and how to maintain advantageous positions while avoiding third-party situations." },
        { id: 'loadout_optimization', title: 'Loadout Optimization', instruction: "Suggest optimal weapon combinations and equipment priorities. Consider current meta, personal playstyle, and how to adapt loadouts based on available loot and enemy compositions." },
        { id: 'endgame_strategy', title: 'Endgame Strategy', instruction: "Offer detailed endgame tactics and positioning. Include final circle strategies, engagement timing, and how to maximize win probability in high-pressure final situations." },
    ],
    'MMORPG': [
        storySoFarTab,
        { id: 'class_optimization', title: 'Class Optimization', instruction: "Analyze the current class build and suggest optimizations. Include talent choices, gear priorities, stat allocation, and how to maximize effectiveness for current content and playstyle." },
        { id: 'content_progression', title: 'Content Progression', instruction: "Provide a roadmap for progressing through current and upcoming content. Suggest priority activities, gear upgrades, and how to efficiently advance through dungeons, raids, or PvP content." },
        { id: 'economy_management', title: 'Economy Management', instruction: "Offer strategies for managing in-game resources and economy. Include gold-making tips, auction house strategies, and how to optimize spending for maximum character progression." },
        { id: 'social_strategies', title: 'Social Strategies', instruction: "Suggest approaches for building effective guild relationships and finding groups. Include communication tips, role expectations, and how to become a valuable team member in group content." },
    ],
    'Puzzle': [
        storySoFarTab,
        { id: 'puzzle_patterns', title: 'Puzzle Patterns', instruction: "Identify common puzzle patterns and solution strategies. Provide systematic approaches to different puzzle types and how to recognize key elements that lead to solutions." },
        { id: 'logical_reasoning', title: 'Logical Reasoning', instruction: "Offer advanced logical reasoning techniques and problem-solving methods. Include how to break down complex puzzles, eliminate possibilities, and approach problems systematically." },
        { id: 'time_optimization', title: 'Time Optimization', instruction: "Suggest strategies for solving puzzles more efficiently. Include speed-solving techniques, pattern recognition shortcuts, and how to minimize trial-and-error approaches." },
        { id: 'difficulty_progression', title: 'Difficulty Progression', instruction: "Outline strategies for tackling increasingly difficult puzzles. Include preparation methods, skill development priorities, and how to build confidence for challenging content." },
    ],
    'Horror': [
        storySoFarTab,
        { id: 'survival_strategies', title: 'Survival Strategies', instruction: "Provide comprehensive survival tactics for the current situation. Include resource management, safe zone identification, and how to navigate dangerous areas while minimizing risk." },
        { id: 'enemy_behavior', title: 'Enemy Behavior', instruction: "Analyze enemy patterns and suggest counter-strategies. Include how to avoid detection, exploit enemy weaknesses, and use the environment to your advantage against threats." },
        { id: 'atmosphere_navigation', title: 'Atmosphere Navigation', instruction: "Offer strategies for managing the psychological aspects of horror gameplay. Include how to maintain composure, use audio cues effectively, and navigate tense situations." },
        { id: 'resource_management', title: 'Resource Management', instruction: "Suggest optimal resource allocation and conservation strategies. Include inventory management, crafting priorities, and how to maximize survival potential with limited supplies." },
    ]
};

// Enhanced Types for Otakon AI v19
export interface PlayerProfile {
  hintStyle: 'Cryptic' | 'Balanced' | 'Direct';
  playerFocus: 'Story-Driven' | 'Completionist' | 'Strategist';
  preferredTone: 'Encouraging' | 'Professional' | 'Casual';
  spoilerTolerance: 'Strict' | 'Moderate' | 'Relaxed';
  isFirstTime: boolean;
  createdAt: number;
  lastUpdated: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferences?: string[];
}

export interface BuildSnapshot {
  timestamp: number;
  level: number;
  stats: Record<string, number>;
  equipment: string[];
  skills: string[];
  notes: string;
}

export interface SessionSummary {
  date: number;
  duration: number;
  objectives: string[];
  discoveries: string[];
  summary: string;
}

export interface GameContext {
  playthroughCount: number;
  lastSessionDate: number;
  totalPlayTime: number;
  objectivesCompleted: string[];
  secretsFound: string[];
  buildHistory: BuildSnapshot[];
  sessionSummaries: SessionSummary[];
  gameName?: string;
}

export interface ProactiveInsight {
  id: string;
  type: 'build_optimization' | 'lore_summary' | 'mechanic_explanation' | 'session_summary';
  trigger: 'objective_complete' | 'inventory_change' | 'area_discovery' | 'session_start';
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  isRead: boolean;
}

export interface ConversationContext {
  conversationId: string;
  gameId: string | null;
  lastInteraction: number;
  sessionStart: number;
  messageHistory: string[];
  userIntent: 'new_query' | 'clarification' | 'follow_up' | 'game_switch';
  contextTags: Record<string, any>;
}

export interface StructuredResponse {
  type: 'new_help' | 'follow_up' | 'game_switch' | 'session_continuation';
  sections: ResponseSection[];
  context: ResponseContext;
  formatting: ResponseFormatting;
}

export interface ResponseSection {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  isCollapsible?: boolean;
}

export interface ResponseContext {
  gameId: string;
  lastInteraction: number;
  conversationHistory: string[];
  userIntent: 'new_query' | 'clarification' | 'follow_up' | 'game_switch';
  sessionDuration: number;
}

export interface ResponseFormatting {
  useHeaders: boolean;
  useBulletPoints: boolean;
  useNumberedLists: boolean;
  useCallouts: boolean;
  useProgressIndicators: boolean;
  sections?: ResponseSection[];
  tone?: 'casual' | 'formal' | 'encouraging' | 'technical';
  maxLength?: number;
}

export interface ResponseSection {
  title: string;
  content: string;
  footer?: string;
}

// Enhanced Conversation interface extending current Conversation
export interface ConversationV19 extends Conversation {
  playerProfile?: PlayerProfile;
  gameContext?: GameContext;
  proactiveInsights?: ProactiveInsight[];
  userId?: string;
  crossGameReferences?: string[]; // Other game IDs this user has played
}

// Enhanced Insight Types for v19
export interface InsightTab {
  id: string;
  title: string;
  content?: string;
  instruction?: string;
  conversationId?: string;
  tabId?: string;
  tabTitle?: string;
  tabType?: 'objective' | 'inventory' | 'progress' | 'suggestions' | 'custom';
  isPinned?: boolean;
  orderIndex?: number;
  metadata?: Record<string, any>;
  webSearch?: boolean; // Add webSearch property
}

export interface EnhancedInsightTab extends InsightTab {
    priority: 'high' | 'medium' | 'low';
    playerFocus: string[];
    hintStyle: string[];
    isProfileSpecific: boolean;
    customInstruction?: string;
    isNewGamePill?: boolean;
    generationModel?: 'free' | 'pro';
    lastUpdated?: number;
}

export interface ProfileAwareInsightConfig {
    tabs: EnhancedInsightTab[];
    contentInstructions: Record<string, string>;
    responseFormatting: Record<string, any>;
}

// Otaku Diary System Interfaces
export interface DiaryTask {
  id: string;
  title: string;
  description: string;
  type: 'user_created' | 'ai_suggested';
  status: 'pending' | 'completed' | 'need_help';
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  createdAt: number;
  completedAt?: number;
  gameId: string;
  source?: string; // AI response or user input
  priority?: 'low' | 'medium' | 'high';
  sourceMessageId?: string; // Link to original message/insight
}

export interface DiaryFavorite {
  id: string;
  content: string;
  type: 'ai_response' | 'insight' | 'lore';
  gameId: string;
  createdAt: number;
  context?: string;
  sourceMessageId?: string;
  sourceInsightId?: string;
}

export interface DetectedTask {
  title: string;
  description: string;
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  confidence: number;
  source: string;
}

// Additional missing types
export interface Usage {
  textQueries: number;
  imageQueries: number;
  insights: number;
  textCount: number;
  imageCount: number;
  textLimit: number;
  imageLimit: number;
  tier: UserTier;
}

export interface OnboardingStep {
  stepName: string;
  stepOrder: number;
  completionTime?: number;
  skipped?: boolean;
  startTime?: number;
  metadata?: Record<string, any>;
}

export interface TierUpgradeAttempt {
  fromTier: string;
  toTier: string;
  timestamp: number;
  success: boolean;
  reason?: string;
  attemptSource?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export interface FeatureUsageEvent {
  featureName: string;
  action: string;
  timestamp: number;
  metadata?: Record<string, any>;
  featureCategory?: string;
}

export interface CacheStrategy {
  name: string;
  description: string;
  enabled: boolean;
  ttl?: number;
  priority?: number;
  maxSize?: number;
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  totalRequests: number;
  memoryUsage?: number;
  storageUsage?: number;
}