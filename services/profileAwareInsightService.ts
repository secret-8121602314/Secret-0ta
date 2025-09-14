import { enhancedInsightService } from './enhancedInsightService';
import { playerProfileService } from './playerProfileService';
import { generateInsightWithSearch } from './geminiService';
import { PlayerProfile, GameContext, EnhancedInsightTab } from './types';

/**
 * 🚨 API COST OPTIMIZATION STRATEGY:
 * 
 * 1. NO AUTOMATIC API CALLS - Only when user explicitly requests help
 * 2. FREE USERS: Always use Gemini 2.5 Flash for all queries
 * 3. PAID USERS: 
 *    - Gemini 2.5 Flash for regular queries (text, image, image+text)
 *    - Gemini 2.5 Pro ONLY ONCE when new game pill is created for insights
 *    - After that, always use Flash for updates and follow-up queries
 * 
 * This ensures maximum cost efficiency while maintaining quality for paid users
 */
export interface ProfileAwareInsightResult {
    tabId: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    isProfileSpecific: boolean;
    generationModel: 'free' | 'pro';
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
        userTier: 'free' | 'paid',
        profile: Promise<PlayerProfile>,
        gameContext?: GameContext,
        onError?: (message: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Await the profile
            const resolvedProfile = await profile;

            // Generate tabs based on user tier
            const tabs = enhancedInsightService.generateProfileAwareTabsForNewGame(
                genre, 
                resolvedProfile, 
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
                    generationModel: 'free' as const,
                    lastUpdated: Date.now()
                }));
            }

            // For NEW GAME PILLS: Use Pro model for paid users, Flash for free users
            const results: ProfileAwareInsightResult[] = [];
            
            for (const tab of tabs) {
                if (tab.isNewGamePill) {
                    try {
                        let content: string;
                        
                        if (userTier === 'paid') {
                            // PAID USERS: Use Pro model for new game pill insights (ONLY time Pro is used)
                            console.log(`💰 Using Gemini 2.5 Pro for new game pill insight: ${tab.title}`);
                            if (!gameContext) {
                                onError?.(`Game context not found for ${gameName}`);
                                continue;
                            }
                            content = await this.generateContentWithProModel(
                                tab, 
                                gameName, 
                                genre, 
                                progress, 
                                resolvedProfile, 
                                gameContext
                            );
                        } else {
                            // FREE USERS: Use free model for new game pill insights
                            console.log(`🆓 Using Gemini 2.5 Free for new game pill insight: ${tab.title}`);                                                                                                           
                            if (!gameContext) {
                                onError?.(`Game context not found for ${gameName}`);
                                continue;
                            }
                            content = await this.generateContentWithFreeModel(
                                tab, 
                                gameName, 
                                genre, 
                                progress, 
                                resolvedProfile, 
                                gameContext
                            );
                        }
                        
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: content,
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: userTier === 'paid' ? 'pro' : 'free',
                            lastUpdated: Date.now()
                        });
                    } catch (error) {
                        console.error(`Error generating content for tab ${tab.id}:`, error);
                        onError?.(`Failed to generate content for ${tab.title}`);
                        
                        // Fallback to basic content
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: `Content generation failed. Ask me about ${tab.title} for personalized help.`,                                                                                                     
                            priority: tab.priority,
                            isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'free' as const,
                            lastUpdated: Date.now()
                        });
                    }
                }
            }

            return results;
            
        } catch (error) {
            console.error('Error generating insights for new game pill:', error);
            onError?.(`Failed to generate game insights`);
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
        profile: Promise<PlayerProfile>,
        onError: (error: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Only update if user explicitly requested it
            if (!existingTabs || existingTabs.length === 0) {
                return [];
            }

            // Await the profile
            const resolvedProfile = await profile;
            if (!resolvedProfile) {
                onError('Player profile not found');
                return [];
            }

            // Mark tabs for Flash model updates
            const updatedTabs = enhancedInsightService.updateExistingTabs(existingTabs, userTier);
            
            const results: ProfileAwareInsightResult[] = [];
            
            for (const tab of updatedTabs) {
                try {
                    // ALWAYS use free model for updates (cost optimization for ALL users)
                    console.log(`🔄 Using Gemini 2.5 Free for insight update: ${tab.title}`);
                    const content = await this.generateContentWithFreeModel(
                        tab, 
                        gameName, 
                        genre, 
                        progress, 
                        resolvedProfile, 
                        await playerProfileService.getGameContext(gameName)
                    );
                    
                    results.push({
                        tabId: tab.id,
                        title: tab.title,
                        content: content,
                        priority: tab.priority,
                        isProfileSpecific: tab.isProfileSpecific,
                            generationModel: 'free' as const,
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
                            generationModel: 'free' as const,
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
     * Generate content using Gemini 2.5 Free (for updates and cost optimization)
     */
    private async generateContentWithFreeModel(
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

        const content = await generateInsightWithSearch(prompt, 'pro'); // Use Pro model
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
     * 
     * CRITICAL: NO AUTOMATIC UPDATES - API calls only happen when user explicitly requests them
     */
    shouldUpdateInsights(currentProfile: PlayerProfile, currentGameContext: GameContext, lastUpdateTime: number): boolean {                                                                                             
        // NO AUTOMATIC UPDATES - Only update when explicitly requested by user
        // This prevents any background API calls and ensures cost optimization
        return false;
    }

    /**
     * Get the order for generating insights (only when explicitly requested)
     */
    async getInsightGenerationOrder(tabs: EnhancedInsightTab[]): Promise<string[]> {
        // Prioritize by importance and profile specificity
        const profile = await playerProfileService.getProfile() || playerProfileService.getDefaultProfile();
        const sortedTabs = enhancedInsightService.prioritizeTabsForProfile(tabs, profile);
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
     * Get tabs that should use free model (updates and free users)
     */
    getTabsForFreeModel(tabs: EnhancedInsightTab[]): EnhancedInsightTab[] {
        return enhancedInsightService.getTabsForFreeModel(tabs);
    }
}

export const profileAwareInsightService = ProfileAwareInsightService.getInstance();
