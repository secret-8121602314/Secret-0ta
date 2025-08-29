import { PlayerProfile, InsightTab, GameContext } from './types';
import { playerProfileService } from './playerProfileService';

export interface EnhancedInsightTab extends InsightTab {
    priority: 'high' | 'medium' | 'low';
    playerFocus: string[];
    hintStyle: string[];
    isProfileSpecific: boolean;
    customInstruction?: string;
    isNewGamePill?: boolean; // Track if this is from a new game pill
    lastUpdated?: number;
    generationModel?: 'flash' | 'pro'; // Track which model was used
}

export interface ProfileAwareInsightConfig {
    tabs: EnhancedInsightTab[];
    contentInstructions: Record<string, string>;
    responseFormatting: Record<string, any>;
}

class EnhancedInsightService {
    private static instance: EnhancedInsightService;
    
    private constructor() {}
    
    static getInstance(): EnhancedInsightService {
        if (!EnhancedInsightService.instance) {
            EnhancedInsightService.instance = new EnhancedInsightService();
        }
        return EnhancedInsightService.instance;
    }

    /**
     * Generate profile-aware tabs for a new game pill (ONLY when explicitly requested)
     * This is the ONLY time we use Gemini 2.5 Pro for paid users
     */
    generateProfileAwareTabsForNewGame(
        genre: string, 
        playerProfile: PlayerProfile, 
        gameContext: GameContext,
        userTier: 'free' | 'paid'
    ): EnhancedInsightTab[] {
        // For free users, return basic tabs without API calls
        if (userTier === 'free') {
            return this.getBasicTabsForGenre(genre);
        }

        // For paid users, generate enhanced tabs (will be populated with Gemini 2.5 Pro)
        const baseTabs = this.getBaseTabsForGenre(genre);
        const profileSpecificTabs = this.generateProfileSpecificTabs(playerProfile, gameContext);
        
        const allTabs = [...baseTabs, ...profileSpecificTabs];
        
        // Mark these as new game pill tabs
        return allTabs.map(tab => ({
            ...tab,
            isNewGamePill: true,
            generationModel: 'pro' as const, // Will use Gemini 2.5 Pro
            lastUpdated: Date.now()
        }));
    }

    /**
     * Update existing tabs with new content (uses Gemini 2.5 Flash for all users)
     * This is called when user makes explicit queries
     */
    updateExistingTabs(
        existingTabs: EnhancedInsightTab[],
        userTier: 'free' | 'paid'
    ): EnhancedInsightTab[] {
        // Always use Flash model for updates (cost optimization)
        return existingTabs.map(tab => ({
            ...tab,
            generationModel: 'flash' as const,
            lastUpdated: Date.now()
        }));
    }

    /**
     * Check if tabs need content generation (only for new game pills)
     */
    needsContentGeneration(tabs: EnhancedInsightTab[]): boolean {
        return tabs.some(tab => tab.isNewGamePill && !tab.content);
    }

    /**
     * Get tabs that should use Pro model (only new game pills for paid users)
     */
    getTabsForProModel(tabs: EnhancedInsightTab[], userTier: 'free' | 'paid'): EnhancedInsightTab[] {
        if (userTier === 'free') return [];
        return tabs.filter(tab => tab.isNewGamePill && !tab.content);
    }

    /**
     * Get tabs that should use Flash model (updates and free users)
     */
    getTabsForFlashModel(tabs: EnhancedInsightTab[]): EnhancedInsightTab[] {
        return tabs.filter(tab => !tab.isNewGamePill || tab.content);
    }

    /**
     * Get tabs for a specific genre
     */
    getTabsForGenre(genre: string): EnhancedInsightTab[] {
        return this.getBaseTabsForGenre(genre);
    }

    /**
     * Generate basic tabs for free users (no API calls)
     */
    private getBasicTabsForGenre(genre: string): EnhancedInsightTab[] {
        const baseTabs = this.getBaseTabsForGenre(genre);
        
        return baseTabs.map(tab => ({
            ...tab,
            isNewGamePill: false,
            generationModel: 'flash' as const,
            content: this.getBasicContentForTab(tab.title, genre),
            lastUpdated: Date.now()
        }));
    }

    /**
     * Get basic content without API calls (for free users)
     */
    private getBasicContentForTab(tabTitle: string, genre: string): string {
        // Provide basic, helpful content without AI generation
        const basicContent: Record<string, string> = {
            'Getting Started': `Welcome to ${genre}! This tab will show you essential tips and strategies to begin your journey.`,
            'Core Mechanics': `Learn the fundamental gameplay mechanics that make ${genre} unique and engaging.`,
            'Progression Tips': `Discover the best ways to advance and improve your skills in ${genre}.`,
            'Common Challenges': `Find solutions to typical obstacles that ${genre} players encounter.`,
            'Advanced Strategies': `Master advanced techniques once you're comfortable with the basics.`
        };

        return basicContent[tabTitle] || `Explore ${tabTitle} to enhance your ${genre} experience.`;
    }

    /**
     * Get basic content for a tab
     */
    public getDefaultContentForTab(tabTitle: string, genre?: string): string {
        const genreContext = genre ? ` in ${genre} games` : '';
        return `This ${tabTitle.toLowerCase()} tab will provide personalized guidance${genreContext}. Ask me specific questions to get detailed, tailored advice.`;
    }

    /**
     * Get base tabs for any genre (no API calls)
     */
    private getBaseTabsForGenre(genre: string): EnhancedInsightTab[] {
        // Otaku Diary is always the first tab for all games
        const otakuDiaryTab: EnhancedInsightTab = {
            id: 'otaku-diary',
            title: '📖 Otaku Diary',
            priority: 'high',
            playerFocus: [],
            hintStyle: [],
            isProfileSpecific: false,
            customInstruction: 'This is your personal game diary for tracking tasks and favorites. No AI content generation needed.'
        };

        const genreSpecificTabs: Record<string, EnhancedInsightTab[]> = {
            'rpg': [
                { id: 'getting-started', title: 'Getting Started', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'character-building', title: 'Character Building', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'combat-strategies', title: 'Combat Strategies', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'quest-guide', title: 'Quest Guide', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'lore-exploration', title: 'Lore Exploration', priority: 'low', playerFocus: [], hintStyle: [], isProfileSpecific: false }
            ],
            'action': [
                { id: 'getting-started', title: 'Getting Started', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'combat-mechanics', title: 'Combat Mechanics', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'movement-tips', title: 'Movement Tips', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'weapon-guide', title: 'Weapon Guide', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'boss-strategies', title: 'Boss Strategies', priority: 'low', playerFocus: [], hintStyle: [], isProfileSpecific: false }
            ],
            'strategy': [
                { id: 'getting-started', title: 'Getting Started', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'resource-management', title: 'Resource Management', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'tactical-planning', title: 'Tactical Planning', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'unit-composition', title: 'Unit Composition', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'advanced-tactics', title: 'Advanced Tactics', priority: 'low', playerFocus: [], hintStyle: [], isProfileSpecific: false }
            ],
            'adventure': [
                { id: 'getting-started', title: 'Getting Started', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'exploration-tips', title: 'Exploration Tips', priority: 'high', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'puzzle-solving', title: 'Puzzle Solving', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'story-progression', title: 'Story Progression', priority: 'medium', playerFocus: [], hintStyle: [], isProfileSpecific: false },
                { id: 'hidden-secrets', title: 'Hidden Secrets', priority: 'low', playerFocus: [], hintStyle: [], isProfileSpecific: false }
            ]
        };

        const genreTabs = genreSpecificTabs[genre] || genreSpecificTabs['rpg'];
        
        // Always return Otaku Diary first, then genre-specific tabs
        return [otakuDiaryTab, ...genreTabs];
    }

    /**
     * Generate profile-specific tabs (no API calls, just structure)
     */
    private generateProfileSpecificTabs(playerProfile: PlayerProfile, gameContext: GameContext): EnhancedInsightTab[] {
        const tabs: EnhancedInsightTab[] = [];

        // Add tabs based on player focus
        if (playerProfile.playerFocus === 'Story-Driven') {
            tabs.push({
                id: 'narrative-themes',
                title: 'Narrative Themes',
                priority: 'high',
                playerFocus: ['Story-Driven'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.getNarrativeThemesInstruction(playerProfile.hintStyle)
            });
        }

        if (playerProfile.playerFocus === 'Completionist') {
            tabs.push({
                id: 'secret-hunting',
                title: 'Secret Hunting',
                priority: 'high',
                playerFocus: ['Completionist'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.getSecretHuntingInstruction(playerProfile.hintStyle)
            });
        }

        if (playerProfile.playerFocus === 'Strategist') {
            tabs.push({
                id: 'optimization-guide',
                title: 'Optimization Guide',
                priority: 'high',
                playerFocus: ['Strategist'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.getOptimizationInstruction(playerProfile.hintStyle)
            });
        }

        // Add playthrough-specific tabs for returning players
        if (gameContext.playthroughCount > 1) {
            tabs.push({
                id: 'playthrough-comparison',
                title: 'Playthrough Comparison',
                priority: 'medium',
                playerFocus: [playerProfile.playerFocus],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.getPlaythroughComparisonInstruction(playerProfile)
            });
        }

        return tabs;
    }

    /**
     * Get custom instructions for different tab types (no API calls)
     */
    private getNarrativeThemesInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': 'Provide subtle hints about story themes without revealing major plot points',
            'Balanced': 'Discuss narrative elements with moderate detail, balancing spoiler avoidance',
            'Direct': 'Explain story themes clearly while maintaining appropriate spoiler warnings'
        };
        return instructions[hintStyle as keyof typeof instructions] || instructions['Balanced'];
    }

    private getSecretHuntingInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': 'Give mysterious clues about hidden content locations',
            'Balanced': 'Provide clear directions to secrets with some exploration challenge',
            'Direct': 'Give precise locations and requirements for finding secrets'
        };
        return instructions[hintStyle as keyof typeof instructions] || instructions['Balanced'];
    }

    private getOptimizationInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': 'Suggest optimization strategies through hints and examples',
            'Balanced': 'Provide balanced optimization advice with clear explanations',
            'Direct': 'Give specific optimization recommendations with detailed steps'
        };
        return instructions[hintStyle as keyof typeof instructions] || instructions['Direct'];
    }

    private getPlaythroughComparisonInstruction(profile: PlayerProfile): string {
        return `Compare different playthrough approaches based on ${profile.playerFocus} style and ${profile.hintStyle} preferences`;
    }

    /**
     * Prioritize tabs based on player profile (no API calls)
     */
    prioritizeTabsForProfile(tabs: EnhancedInsightTab[], profile: PlayerProfile): EnhancedInsightTab[] {
        return tabs.sort((a, b) => {
            // Profile-specific tabs get highest priority
            if (a.isProfileSpecific && !b.isProfileSpecific) return -1;
            if (!a.isProfileSpecific && b.isProfileSpecific) return 1;
            
            // Then by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Generate content instructions for AI (no API calls, just instructions)
     */
    generateContentInstructions(tab: EnhancedInsightTab, profile: PlayerProfile, gameContext: GameContext): string {
        let instructions = `Generate content for "${tab.title}" tab. `;
        
        if (tab.customInstruction) {
            instructions += tab.customInstruction + ' ';
        }
        
        instructions += `Use ${profile.hintStyle} hint style and focus on ${profile.playerFocus} gameplay. `;
        
        if (gameContext.playthroughCount > 1) {
            instructions += `This is playthrough #${gameContext.playthroughCount}, so you can reference previous experiences. `;
        }
        
        instructions += `Keep content engaging and actionable.`;
        
        return instructions;
    }
}

export const enhancedInsightService = EnhancedInsightService.getInstance();
