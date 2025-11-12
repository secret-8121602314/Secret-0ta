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
  // Query-based usage limits (from database)
  textCount: number;
  imageCount: number;
  textLimit: number;
  imageLimit: number;
  totalRequests: number;
  lastReset: number;
  // Legacy nested usage object (kept for backward compatibility)
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
export type OnboardingStatus = 'login' | 'initial' | 'features' | 'pro-features' | 'how-to-use' | 'features-connected' | 'tier-splash' | 'profile-setup' | 'complete' | 'loading';
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
  isGameHub?: boolean; // Identifies the default Game Hub conversation - only one per user
  isUnreleased?: boolean; // True for unreleased/upcoming games - no Playing mode, no subtabs
  contextSummary?: string; // AI-generated summary of conversation history (max 500 words, text-only)
  lastSummarizedAt?: number; // Unix timestamp (ms) of when context_summary was last updated
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
  // Enhanced fields from old build (optional for backward compatibility)
  followUpPrompts?: string[]; // 3-4 contextual suggested prompts
  gamePillData?: {
    shouldCreate: boolean;
    gameName: string;
    genre: string;
    wikiContent: Record<string, string>; // Pre-filled subtab content
  };
  progressiveInsightUpdates?: Array<{
    tabId: string;
    title: string;
    content: string;
  }>;
  suggestedTasks?: Array<{
    title: string;
    description: string;
    category: string;
    confidence: number;
    source: string;
  }>;
  stateUpdateTags?: string[]; // Game state changes (OBJECTIVE_COMPLETE, TRIUMPH, etc.)
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
  'Default': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'missed_items', title: 'Items You May Have Missed', type: 'items', instruction: "Based on the player's current progress, identify 2-3 significant items, secrets, or side quests they might have overlooked in areas they have already visited. Provide clear, actionable hints about their locations without giving away the exact solution. Use landmarks and environmental descriptions. Example: 'In the Whispering Caverns, a waterfall hides more than just a damp cave wall.'" },
    { id: 'game_lore', title: 'Relevant Lore', type: 'story', instruction: "Provide a fascinating, detailed, spoiler-free piece of lore about the game's world, characters, or backstory that is relevant to the player's current situation or recent events. This should be a deep-dive, not a short summary." },
    { id: 'build_guide', title: 'Build Guide', type: 'strategies', instruction: "Suggest one or two detailed, effective character builds or loadouts using items and skills available up to the current progress point. Be specific about the synergy between components, stat allocation, and how the build excels in the player's current or upcoming challenges." },
    { id: 'next_session_plan', title: 'Plan Your Next Session', type: 'tips', instruction: "Based on the player's progress and story so far, clearly list 3-4 concrete objectives or tasks they can tackle in their next gameplay session. This should include a mix of main quests, important side quests, and interesting areas to explore next. Provide a brief, compelling reason for each suggestion." },
  ],
  'Action RPG': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'quest_log', title: 'Active Quests', type: 'walkthrough', instruction: "Summarize the active main quest and suggest 2-3 relevant side quests available in the current area. Explain the potential rewards or story connections." },
    { id: 'build_optimization', title: 'Build Optimization', type: 'strategies', instruction: "Analyze the player's likely stats and gear. Suggest 2-3 specific improvements, like stat allocation changes, better weapon affinities, or spells that synergize with their build." },
    { id: 'boss_strategy', title: 'Upcoming Boss Strategy', type: 'strategies', instruction: "A significant challenge may lie ahead. **Do not name the upcoming boss or describe its appearance.** Instead, provide clear, actionable tactical advice based on its likely attack patterns and weaknesses. Suggest effective weapon types, armor properties, status effects, and specific strategies (e.g., 'This foe is relentless up close; focus on ranged attacks and stay mobile,' or 'Its armor is vulnerable to fire damage; enchanted weapons will be key.'). The advice should be practical, not metaphorical." },
    { id: 'hidden_paths', title: 'Hidden Paths & Secrets', type: 'tips', instruction: "Hint at a secret path or hidden area nearby that the player may have missed. **Do not give explicit directions.** Instead, provide a clear clue tied to a specific landmark or environmental feature. The goal is to make the player think 'Aha!' not 'Huh?'. Example: 'The large statue in the Grand Hall seems to be pointing at a specific tapestry on the wall...' or 'Listen for the sound of running water behind the library's northern bookshelf.'" },
  ],
  'RPG': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'character_building', title: 'Character Building', type: 'strategies', instruction: "Provide detailed character building advice including stat allocation, skill trees, and class optimization based on the player's current progress and available options." },
    { id: 'combat_strategies', title: 'Combat Strategies', type: 'strategies', instruction: "Detail effective combat strategies, party composition advice, and tactical approaches for current or upcoming challenges." },
    { id: 'quest_guide', title: 'Quest Guide', type: 'walkthrough', instruction: "Provide guidance on active quests, including main story quests and important side quests. Include rewards and story connections." },
    { id: 'lore_exploration', title: 'Lore Exploration', type: 'story', instruction: "Dive deep into the game's lore, world-building, and backstory relevant to the player's current progress without spoiling future revelations." },
  ],
  'First-Person Shooter': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'loadout_analysis', title: 'Loadout Analysis', type: 'strategies', instruction: "Analyze the probable current weapon loadout. Suggest 2 alternative, powerful loadouts (primary, secondary, equipment) for the current situation or map, explaining the strategic advantage of each." },
    { id: 'map_strategies', title: 'Map Strategies', type: 'strategies', instruction: "Provide 3 key strategic tips for the likely current map or area, focusing on positioning, flanking routes, and objective control." },
    { id: 'enemy_intel', title: 'Enemy Intel', type: 'tips', instruction: "You'll encounter new threats in this zone. **Do not name the enemy types or describe their appearance in a way that spoils their reveal.** Describe their behavior, attack patterns, and a key vulnerability in a tactical, in-universe way. The advice must be actionable. For example: 'Some hostiles carry volatile canisters on their backs. A well-placed shot could trigger a chain reaction.' or 'Listen for a high-pitched whine; it signals a devastating charge you must evade immediately.'" },
    { id: 'pro_tips', title: 'Pro Tips', type: 'tips', instruction: "Offer 3 advanced tips or 'pro strats' for this game that a new player might not know, such as movement tricks, ability combos, or unusual weapon uses." },
  ],
  'Strategy': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'current_board_state', title: 'Current State Analysis', type: 'strategies', instruction: "Analyze the current game state (e.g., board position, resources, army composition). Provide a high-level summary of strengths, weaknesses, and immediate threats." },
    { id: 'opening_moves', title: 'Opening Builds', type: 'strategies', instruction: "Describe 2-3 popular and effective opening strategies or build orders for the player's faction or starting position." },
    { id: 'unit_counters', title: 'Unit Counters', type: 'strategies', instruction: "Intelligence suggests the enemy will deploy units with specific strengths. **Do not name the enemy units.** Instead, describe their function (e.g., 'fast-moving aerial threats', 'heavily armored ground forces') and suggest specific, effective counters from the player's available arsenal. Explain *why* the counter works (e.g., '...because your Stinger units have tracking projectiles that are effective against agile air targets.')." },
    { id: 'economy_guide', title: 'Economy Management', type: 'tips', instruction: "Provide 3 tips for optimizing resource generation and spending at the player's current stage of the game." },
  ],
  'Adventure': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'exploration_tips', title: 'Exploration Tips', type: 'tips', instruction: "Provide helpful exploration tips for the current area, including how to find hidden paths, secrets, and collectibles without explicit spoilers." },
    { id: 'puzzle_solving', title: 'Puzzle Solving', type: 'strategies', instruction: "Offer guidance on current or recent puzzles, providing hints that lead the player toward the solution without giving it away entirely." },
    { id: 'story_progression', title: 'Story Progression', type: 'walkthrough', instruction: "Guide the player through story progression, outlining what to do next while maintaining suspense and avoiding future spoilers." },
    { id: 'hidden_secrets', title: 'Hidden Secrets', type: 'tips', instruction: "Hint at hidden secrets, collectibles, or optional content the player may have missed, using environmental clues and landmarks." },
  ],
  'Simulation': [
    { id: 'goal_suggestions', title: 'Goal Suggestions', type: 'tips', instruction: "Based on the current state, suggest 3 short-term and 1 long-term goal to work towards. For example, expanding a facility, achieving a milestone, or unlocking a new technology." },
    { id: 'efficiency_tips', title: 'Efficiency & Optimization', type: 'strategies', instruction: "Provide 3 actionable tips for improving the efficiency of the player's current setup, such as optimizing a production line, improving traffic flow, or managing finances better." },
    { id: 'hidden_mechanics', title: 'Hidden Mechanics', type: 'tips', instruction: "Explain one non-obvious game mechanic that can significantly impact gameplay, which the player may not be aware of yet." },
    { id: 'disaster_prep', title: 'Disaster Prep', type: 'strategies', instruction: "Great endeavors are often tested. **Do not name the specific disaster or event.** Hint at a potential future challenge in a thematic way and suggest 2-3 concrete, preventative measures. For example: 'The markets are fickle; diversifying your income streams and building a cash reserve can weather any financial storm.' or 'The earth sometimes trembles. Ensuring your infrastructure is reinforced near fault lines could prevent a catastrophe.'" },
  ],
  'Sports': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'team_management', title: 'Team Management', type: 'strategies', instruction: "Analyze the current team composition and suggest 2-3 strategic improvements. Consider player stats, chemistry, formation adjustments, or tactical changes that could enhance performance based on the current season progress." },
    { id: 'training_focus', title: 'Training Focus', type: 'tips', instruction: "Based on the current team's strengths and weaknesses, recommend specific training priorities. Suggest which players need development, what skills to focus on, and how to prepare for upcoming challenges." },
    { id: 'tactical_analysis', title: 'Tactical Analysis', type: 'strategies', instruction: "Provide detailed tactical advice for the current situation. This could include formation strategies, player positioning, set-piece tactics, or counter-strategies against specific opponents you've faced or are about to face." },
    { id: 'season_progression', title: 'Season Progression', type: 'walkthrough', instruction: "Outline the key objectives and milestones for the current season phase. Suggest realistic goals, important matches to focus on, and strategic decisions that could impact the team's long-term success." },
  ],
  'Multiplayer Shooter': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'meta_analysis', title: 'Meta Analysis', type: 'strategies', instruction: "Analyze the current meta and suggest 2-3 effective loadouts or strategies. Consider weapon balance, map-specific tactics, and counter-strategies against popular playstyles in the current meta." },
    { id: 'team_coordination', title: 'Team Coordination', type: 'strategies', instruction: "Provide advanced team play strategies. Suggest communication tactics, role assignments, positioning strategies, and how to counter common enemy team compositions or strategies." },
    { id: 'map_control', title: 'Map Control', type: 'strategies', instruction: "Offer detailed map control strategies for the current or upcoming maps. Include key positions, rotation paths, objective control tactics, and how to maintain map dominance." },
    { id: 'skill_development', title: 'Skill Development', type: 'tips', instruction: "Identify specific skills to improve based on current performance. Suggest aim training routines, movement techniques, game sense improvements, or mechanical skills that could elevate gameplay." },
  ],
  'Multiplayer Sports': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'competitive_strategy', title: 'Competitive Strategy', type: 'strategies', instruction: "Analyze the competitive landscape and suggest strategies for ranked/competitive play. Consider meta shifts, opponent tendencies, and advanced tactics that separate good players from great ones." },
    { id: 'team_synergy', title: 'Team Synergy', type: 'strategies', instruction: "Provide advice on building effective team compositions and strategies. Suggest player combinations, communication protocols, and how to maximize team chemistry and coordination." },
    { id: 'performance_optimization', title: 'Performance Optimization', type: 'tips', instruction: "Offer specific tips for improving individual and team performance. Include practice routines, skill development priorities, and how to adapt to different opponents and playstyles." },
    { id: 'ranked_progression', title: 'Ranked Progression', type: 'walkthrough', instruction: "Outline a strategic approach to climbing ranks. Suggest focus areas, common mistakes to avoid, and how to maintain consistency in competitive matches." },
  ],
  'Racing': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'vehicle_tuning', title: 'Vehicle Tuning', type: 'strategies', instruction: "Analyze the current vehicle setup and suggest tuning adjustments. Consider track characteristics, weather conditions, and racing style to recommend optimal configurations for current or upcoming races." },
    { id: 'track_strategy', title: 'Track Strategy', type: 'strategies', instruction: "Provide detailed racing strategies for current or upcoming tracks. Include braking points, racing lines, overtaking opportunities, and how to handle specific track sections or challenges." },
    { id: 'race_craft', title: 'Race Craft', type: 'tips', instruction: "Offer advanced racing techniques and strategies. Include defensive driving, overtaking tactics, pit stop strategies, and how to manage tire wear and fuel consumption effectively." },
    { id: 'championship_focus', title: 'Championship Focus', type: 'walkthrough', instruction: "Outline strategic priorities for the current championship or season. Suggest which races to focus on, points management strategies, and how to maximize championship potential." },
  ],
  'Fighting': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'character_analysis', title: 'Character Analysis', type: 'strategies', instruction: "Analyze the current character's strengths, weaknesses, and optimal playstyle. Suggest advanced techniques, combo routes, and how to maximize the character's potential in different matchups." },
    { id: 'matchup_strategy', title: 'Matchup Strategy', type: 'strategies', instruction: "Provide detailed matchup strategies against common opponents. Include character-specific tactics, counter-strategies, and how to exploit opponent weaknesses while covering your own." },
    { id: 'execution_training', title: 'Execution Training', type: 'tips', instruction: "Suggest specific training routines to improve execution and consistency. Include combo practice, timing drills, and techniques to master difficult inputs or advanced mechanics." },
    { id: 'tournament_prep', title: 'Tournament Prep', type: 'tips', instruction: "Outline preparation strategies for competitive play. Include mental preparation, warm-up routines, and how to maintain peak performance during extended tournament sessions." },
  ],
  'Battle Royale': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'drop_strategy', title: 'Drop Strategy', type: 'strategies', instruction: "Analyze optimal landing locations and early-game strategies. Consider loot quality, player density, and how to maximize survival chances while securing good equipment for the mid-game." },
    { id: 'positioning_tactics', title: 'Positioning Tactics', type: 'strategies', instruction: "Provide advanced positioning strategies for different phases of the match. Include rotation timing, zone management, and how to maintain advantageous positions while avoiding third-party situations." },
    { id: 'loadout_optimization', title: 'Loadout Optimization', type: 'strategies', instruction: "Suggest optimal weapon combinations and equipment priorities. Consider current meta, personal playstyle, and how to adapt loadouts based on available loot and enemy compositions." },
    { id: 'endgame_strategy', title: 'Endgame Strategy', type: 'strategies', instruction: "Offer detailed endgame tactics and positioning. Include final circle strategies, engagement timing, and how to maximize win probability in high-pressure final situations." },
  ],
  'MMORPG': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'class_optimization', title: 'Class Optimization', type: 'strategies', instruction: "Analyze the current class build and suggest optimizations. Include talent choices, gear priorities, stat allocation, and how to maximize effectiveness for current content and playstyle." },
    { id: 'content_progression', title: 'Content Progression', type: 'walkthrough', instruction: "Provide a roadmap for progressing through current and upcoming content. Suggest priority activities, gear upgrades, and how to efficiently advance through dungeons, raids, or PvP content." },
    { id: 'economy_management', title: 'Economy Management', type: 'tips', instruction: "Offer strategies for managing in-game resources and economy. Include gold-making tips, auction house strategies, and how to optimize spending for maximum character progression." },
    { id: 'social_strategies', title: 'Social Strategies', type: 'tips', instruction: "Suggest approaches for building effective guild relationships and finding groups. Include communication tips, role expectations, and how to become a valuable team member in group content." },
  ],
  'Puzzle': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'puzzle_patterns', title: 'Puzzle Patterns', type: 'strategies', instruction: "Identify common puzzle patterns and solution strategies. Provide systematic approaches to different puzzle types and how to recognize key elements that lead to solutions." },
    { id: 'logical_reasoning', title: 'Logical Reasoning', type: 'strategies', instruction: "Offer advanced logical reasoning techniques and problem-solving methods. Include how to break down complex puzzles, eliminate possibilities, and approach problems systematically." },
    { id: 'time_optimization', title: 'Time Optimization', type: 'tips', instruction: "Suggest strategies for solving puzzles more efficiently. Include speed-solving techniques, pattern recognition shortcuts, and how to minimize trial-and-error approaches." },
    { id: 'difficulty_progression', title: 'Difficulty Progression', type: 'tips', instruction: "Outline strategies for tackling increasingly difficult puzzles. Include preparation methods, skill development priorities, and how to build confidence for challenging content." },
  ],
  'Horror': [
    { id: 'story_so_far', title: 'Story So Far', type: 'story', instruction: "Provide a concise summary of the main plot events that have occurred strictly up to the estimated game progress. Do not mention, hint at, or allude to any future events, characters, or plot twists. The summary should read like a journal entry of what has *already happened*." },
    { id: 'survival_strategies', title: 'Survival Strategies', type: 'strategies', instruction: "Provide comprehensive survival tactics for the current situation. Include resource management, safe zone identification, and how to navigate dangerous areas while minimizing risk." },
    { id: 'enemy_behavior', title: 'Enemy Behavior', type: 'strategies', instruction: "Analyze enemy patterns and suggest counter-strategies. Include how to avoid detection, exploit enemy weaknesses, and use the environment to your advantage against threats." },
    { id: 'atmosphere_navigation', title: 'Atmosphere Navigation', type: 'tips', instruction: "Offer strategies for managing the psychological aspects of horror gameplay. Include how to maintain composure, use audio cues effectively, and navigate tense situations." },
    { id: 'resource_management', title: 'Resource Management', type: 'tips', instruction: "Suggest optimal resource allocation and conservation strategies. Include inventory management, crafting priorities, and how to maximize survival potential with limited supplies." },
  ],
};
