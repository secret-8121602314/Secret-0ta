import { enhancedInsightService } from './enhancedInsightService';
import { playerProfileService } from './playerProfileService';
import { generateInsightWithSearch } from './geminiService';
import { PlayerProfile, GameContext, EnhancedInsightTab } from './types';

export interface ProfileAwareInsightResult {
    tabId: string;
    title: string;
    content: string;
    isProfileSpecific: boolean;
    priority: 'high' | 'medium' | 'low';
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
     * Generate profile-aware insights for a game
     */
    async generateProfileAwareInsights(
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string,
        onError: (error: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        try {
            // Get player profile and game context
            const profile = playerProfileService.getProfile();
            const gameContext = playerProfileService.getGameContext(gameName);
            
            if (!profile) {
                console.warn('No player profile found, using default insights');
                return this.generateDefaultInsights(gameName, genre, progress, conversationId, onError);
            }

            // Generate profile-aware tabs
            const profileTabs = enhancedInsightService.generateProfileAwareTabs(
                genre,
                profile,
                gameContext
            );

            // Generate content for each tab
            const results: ProfileAwareInsightResult[] = [];
            
            for (const tab of profileTabs) {
                try {
                    const content = await this.generateTabContent(
                        tab,
                        gameName,
                        genre,
                        progress,
                        profile,
                        gameContext,
                        onError
                    );
                    
                    if (content) {
                        results.push({
                            tabId: tab.id,
                            title: tab.title,
                            content: content,
                            isProfileSpecific: tab.isProfileSpecific,
                            priority: tab.priority,
                            lastUpdated: Date.now()
                        });
                    }
                } catch (error) {
                    console.error(`Error generating content for tab ${tab.id}:`, error);
                    onError(`Failed to generate ${tab.title}: ${error}`);
                }
            }

            return results;
            
        } catch (error) {
            console.error('Error in generateProfileAwareInsights:', error);
            onError(`Failed to generate profile-aware insights: ${error}`);
            return [];
        }
    }

    /**
     * Generate content for a specific tab
     */
    private async generateTabContent(
        tab: EnhancedInsightTab,
        gameName: string,
        genre: string,
        progress: number,
        profile: PlayerProfile,
        gameContext: GameContext,
        onError: (error: string) => void
    ): Promise<string | null> {
        try {
            // Generate custom instructions based on profile
            const customInstructions = enhancedInsightService.generateContentInstructions(
                tab,
                profile,
                gameContext
            );

            // Use the existing insight generation service with custom instructions
            const result = await generateInsightWithSearch(
                gameName,
                genre,
                progress,
                customInstructions,
                tab.title,
                onError,
                new AbortController().signal
            );

            return result || null;
            
        } catch (error) {
            console.error(`Error generating content for tab ${tab.id}:`, error);
            onError(`Failed to generate ${tab.title}: ${error}`);
            return null;
        }
    }

    /**
     * Generate default insights when no profile is available
     */
    private async generateDefaultInsights(
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string,
        onError: (error: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        // Fallback to default insight generation
        // This would integrate with the existing insight system
        return [];
    }

    /**
     * Update insights when player profile changes
     */
    async updateInsightsForProfileChange(
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string,
        onError: (error: string) => void
    ): Promise<ProfileAwareInsightResult[]> {
        console.log('Updating insights due to profile change');
        return this.generateProfileAwareInsights(
            gameName,
            genre,
            progress,
            conversationId,
            onError
        );
    }

    /**
     * Get insight tabs configuration for a specific profile
     */
    getInsightTabsForProfile(
        genre: string,
        profile: PlayerProfile,
        gameContext: GameContext
    ): EnhancedInsightTab[] {
        return enhancedInsightService.generateProfileAwareTabs(
            genre,
            profile,
            gameContext
        );
    }

    /**
     * Check if insights need updating based on profile or progress changes
     */
    shouldUpdateInsights(
        currentProfile: PlayerProfile,
        currentGameContext: GameContext,
        lastUpdateTime: number
    ): boolean {
        const now = Date.now();
        const timeSinceUpdate = now - lastUpdateTime;
        
        // Update if it's been more than 24 hours
        if (timeSinceUpdate > 24 * 60 * 60 * 1000) {
            return true;
        }
        
        // Update if profile has changed significantly
        if (currentProfile.lastUpdated > lastUpdateTime) {
            return true;
        }
        
        // Update if game progress has changed significantly
        if (currentGameContext.lastSessionDate > lastUpdateTime) {
            return true;
        }
        
        return false;
    }

    /**
     * Get priority-based insight generation order
     */
    getInsightGenerationOrder(tabs: EnhancedInsightTab[]): string[] {
        return tabs
            .sort((a, b) => {
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .map(tab => tab.id);
    }
}

export const profileAwareInsightService = ProfileAwareInsightService.getInstance();
