import { enhancedInsightService } from './enhancedInsightService';
import { playerProfileService } from './playerProfileService';
import { generateInsightWithSearch } from './geminiService';
import { PlayerProfile, GameContext, EnhancedInsightTab } from './types';

export interface ProfileAwareInsightResult {
    tabId: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    isProfileSpecific: boolean;
    generationModel: 'flash' | 'pro';
    lastUpdated: number;
}

class ProfileAwareInsightService {
    private static instance: ProfileAwareInsightService;
    
    private constructor() {}
    
    static getInstance(): ProfileAwareInsightService {
        if (!ProfileAwareInsightService.instance) {
            ProfileAwareInsightService.instance = new ProfileAwareInsightService();
        }
        return ProfileAwareInsightService.instance;
    }

    /**
     * Generate insights for a NEW GAME PILL (ONLY when explicitly requested by user)
     * This is the ONLY time we use Gemini 2.5 Pro for paid users
     */
    async generateInsightsForNewGamePill(
        gameName: string, 
        genre: string, 
        progress: number, 
        conversationId: string, 
        userTier: 'free' | 'paid',
        onError: (error: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Get player profile and game context
            const profile = playerProfileService.getProfile();
            const gameContext = playerProfileService.getGameContext(gameName);
            
            if (!profile) {
                onError('Player profile not found');
                return [];
            }

            // Generate tabs based on user tier
            const tabs = enhancedInsightService.generateProfileAwareTabsForNewGame(
                genre, 
                profile, 
                gameContext || playerProfileService.getDefaultGameContext(),
                userTier
            );

            // For free users, return basic content without API calls
            if (userTier === 'free') {
                return tabs.map(tab => ({
                    tabId: tab.id,
                    title: tab.title,
                    content: tab.content || 'Content will be generated when you ask for help.',
                    priority: tab.priority,
                    isProfileSpecific: tab.isProfileSpecific,
                    generationModel: 'flash' as const,
                    lastUpdated: Date.now()
                }));
            }

            // For paid users, generate content with Gemini 2.5 Pro (only for new game pills)
            const results: ProfileAwareInsightResult[] = [];
            
            for (const tab of tabs) {
                if (tab.isNewGamePill) {
                    try {
                        // Use Gemini 2.5 Pro for new game pill content
                        const content = await this.generateContentWithProModel(
                            tab, 
                            gameName, 
                            genre, 
                            progress, 
                            profile, 
                            gameContext
                        );
                        
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: content,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'pro',
                            lastUpdated: Date.now()
                        });
                    } catch (error) {
                        console.error(`Error generating content for tab ${tab.id}:`, error);
                        onError(`Failed to generate content for ${tab.title}`);
                        
                        // Fallback to basic content
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: `Content generation failed. Ask me about ${tab.title} for personalized help.`,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'flash',
                            lastUpdated: Date.now()
                        });
                    }
                }
            }

            return results;
            
        } catch (error) {
            console.error('Error generating insights for new game pill:', error);
            onError('Failed to generate game insights');
            return [];
        }
    }

    /**
     * Update existing insights when user makes explicit queries
     * Always uses Gemini 2.5 Flash for cost optimization
     */
    async updateInsightsForUserQuery(
        gameName: string, 
        genre: string, 
        progress: number, 
        conversationId: string,
        existingTabs: EnhancedInsightTab[],
        userTier: 'free' | 'paid',
        onError: (error: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Only update if user explicitly requested it
            if (!existingTabs || existingTabs.length === 0) {
                return [];
            }

            const profile = playerProfileService.getProfile();
            if (!profile) {
                onError('Player profile not found');
                return [];
            }

            // Mark tabs for Flash model updates
            const updatedTabs = enhancedInsightService.updateExistingTabs(existingTabs, userTier);
            
            const results: ProfileAwareInsightResult[] = [];
            
            for (const tab of updatedTabs) {
                try {
                    // Always use Flash model for updates (cost optimization)
                    const content = await this.generateContentWithFlashModel(
                        tab, 
                        gameName, 
                        genre, 
                        progress, 
                        profile, 
                        playerProfileService.getGameContext(gameName)
                    );
                    
                    results.push({
                        tabId: tab.id,
                        title: tab.title,
                        content: content,
                        priority: tab.priority,
                        isProfileSpecific: tab.isProfileSpecific,
                        generationModel: 'flash',
                        lastUpdated: Date.now()
                    });
                } catch (error) {
                    console.error(`Error updating content for tab ${tab.id}:`, error);
                    onError(`Failed to update ${tab.title}`);
                    
                    // Keep existing content if update fails
                    if (tab.content) {
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: tab.content,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'flash',
                            lastUpdated: tab.lastUpdated || Date.now()
                        });
                    }
                }
            }

            return results;
            
        } catch (error) {
            console.error('Error updating insights for user query:', error);
            onError('Failed to update insights');
            return [];
        }
    }

    /**
     * Generate content using Gemini 2.5 Pro (only for new game pills)
     */
    private async generateContentWithProModel(
        tab: EnhancedInsightTab,
        gameName: string,
        genre: string,
        progress: number,
        profile: PlayerProfile,
        gameContext: GameContext | null
    ): Promise<string> {
        const instructions = enhancedInsightService.generateContentInstructions(tab, profile, gameContext || playerProfileService.getDefaultGameContext());
        
        // Use Gemini 2.5 Pro for new game pill content
        const prompt = `Generate detailed content for the "${tab.title}" tab in ${gameName} (${genre}).
        
${instructions}

Game: ${gameName}
Genre: ${genre}
Progress: ${progress}%
Player Focus: ${profile.playerFocus}
Hint Style: ${profile.hintStyle}
Preferred Tone: ${profile.preferredTone}
Spoiler Tolerance: ${profile.spoilerTolerance}

Generate comprehensive, engaging content that matches the player's preferences.`;

        const content = await generateInsightWithSearch(prompt, 'pro'); // Use Pro model
        return content || `Content for ${tab.title} will be generated when you ask for help.`;
    }

    /**
     * Generate content using Gemini 2.5 Flash (for updates and cost optimization)
     */
    private async generateContentWithFlashModel(
        tab: EnhancedInsightTab,
        gameName: string,
        genre: string,
        progress: number,
        profile: PlayerProfile,
        gameContext: GameContext | null
    ): Promise<string> {
        const instructions = enhancedInsightService.generateContentInstructions(tab, profile, gameContext || playerProfileService.getDefaultGameContext());
        
        // Use Gemini 2.5 Flash for updates (cost optimization)
        const prompt = `Update content for the "${tab.title}" tab in ${gameName} (${genre}).
        
${instructions}

Game: ${gameName}
Genre: ${genre}
Progress: ${progress}%
Player Focus: ${profile.playerFocus}
Hint Style: ${profile.hintStyle}
Preferred Tone: ${profile.preferredTone}
Spoiler Tolerance: ${profile.spoilerTolerance}

Provide updated, relevant content that matches the player's current progress and preferences.`;

        const content = await generateInsightWithSearch(prompt, 'flash'); // Use Flash model
        return content || `Content for ${tab.title} will be updated when you ask for help.`;
    }

    /**
     * Get insight tabs for a profile (no API calls, just structure)
     */
    getInsightTabsForProfile(genre: string, profile: PlayerProfile, gameContext: GameContext): EnhancedInsightTab[] {
        const tabs = enhancedInsightService.generateProfileAwareTabsForNewGame(
            genre, 
            profile, 
            gameContext, 
            'paid' // Assume paid for structure generation
        );
        
        return enhancedInsightService.prioritizeTabsForProfile(tabs, profile);
    }

    /**
     * Check if insights need updating (only for explicit user requests)
     */
    shouldUpdateInsights(currentProfile: PlayerProfile, currentGameContext: GameContext, lastUpdateTime: number): boolean {
        // Only update when explicitly requested by user
        return false; // No automatic updates
    }

    /**
     * Get the order for generating insights (only when explicitly requested)
     */
    getInsightGenerationOrder(tabs: EnhancedInsightTab[]): string[] {
        // Prioritize by importance and profile specificity
        const sortedTabs = enhancedInsightService.prioritizeTabsForProfile(tabs, playerProfileService.getProfile() || playerProfileService.getDefaultProfile());
        return sortedTabs.map(tab => tab.id);
    }

    /**
     * Check if this is a new game pill that needs Pro model generation
     */
    isNewGamePill(tabs: EnhancedInsightTab[]): boolean {
        return enhancedInsightService.needsContentGeneration(tabs);
    }

    /**
     * Get tabs that should use Pro model (only new game pills for paid users)
     */
    getTabsForProModel(tabs: EnhancedInsightTab[], userTier: 'free' | 'paid'): EnhancedInsightTab[] {
        return enhancedInsightService.getTabsForProModel(tabs, userTier);
    }

    /**
     * Get tabs that should use Flash model (updates and free users)
     */
    getTabsForFlashModel(tabs: EnhancedInsightTab[]): EnhancedInsightTab[] {
        return enhancedInsightService.getTabsForFlashModel(tabs);
    }
}

export const profileAwareInsightService = ProfileAwareInsightService.getInstance();
