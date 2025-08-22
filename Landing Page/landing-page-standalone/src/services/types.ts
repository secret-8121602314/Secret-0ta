export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export type ChatMessageFeedback = 'up' | 'down' | 'submitted';

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[]; // data URLs for displaying images in chat
  isFromPC?: boolean;
  sources?: { uri: string; title: string; }[];
  suggestions?: string[];
  triumph?: { type: string; name: string; };
  showUpgradeButton?: boolean;
  feedback?: ChatMessageFeedback;
};

export type UserTier = 'free' | 'pro' | 'vanguard_pro';

export type Usage = {
  textCount: number;
  imageCount: number;
  textLimit: number;
  imageLimit: number;
  tier: UserTier;
};

export type InsightStatus = 'loading' | 'streaming' | 'loaded' | 'error';

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
};

export type Conversations = Record<string, Conversation>;

export const newsPrompts = [
    "What's the latest gaming news?",
    "Which games are releasing soon?",
    "What are the latest game reviews?",
    "Show me the hottest new game trailers.",
];

type InsightTab = {
    id: string;
    title: string;
    instruction: string;
    webSearch?: boolean;
};

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
    ]
};