import { useCallback, useEffect, useState } from 'react';
import { profileAwareInsightService } from '../services/profileAwareInsightService';
import { enhancedInsightService } from '../services/enhancedInsightService';
import { playerProfileService } from '../services/playerProfileService';
import { PlayerProfile, GameContext, EnhancedInsightTab } from '../services/types';

export interface EnhancedInsight {
    tabId: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    isProfileSpecific: boolean;
    generationModel: 'flash' | 'pro';
    lastUpdated: number;
    status: 'idle' | 'loading' | 'loaded' | 'error';
}

export interface UseEnhancedInsightsReturn {
    insights: Record<string, EnhancedInsight>;
    insightTabs: EnhancedInsightTab[];
    isLoading: boolean;
    generateInsightsForNewGame: (gameName: string, genre: string, progress: number, conversationId: string, userTier: 'free' | 'paid') => Promise<void>;
    updateInsightsForUserQuery: (gameName: string, genre: string, progress: number, conversationId: string, userTier: 'free' | 'paid') => Promise<void>;
    retryInsight: (insightId: string, gameName: string, genre: string, progress: number, conversationId: string, userTier: 'free' | 'paid') => Promise<void>;
    shouldUpdateInsights: (lastUpdateTime: number) => boolean;
    isNewGamePill: boolean;
    needsProModel: boolean;
}

export const useEnhancedInsights = (
    conversationId: string, 
    gameName?: string, 
    genre?: string, 
    progress?: number
): UseEnhancedInsightsReturn => {
    const [insights, setInsights] = useState<Record<string, EnhancedInsight>>({});
    const [insightTabs, setInsightTabs] = useState<EnhancedInsightTab[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isNewGamePill, setIsNewGamePill] = useState(false);
    const [needsProModel, setNeedsProModel] = useState(false);

    // Get player profile and game context
    const profile = playerProfileService.getProfile();
    const gameContext = gameName ? playerProfileService.getGameContext(gameName) : null;

    // Initialize insights with placeholder tabs (no API calls)
    useEffect(() => {
        if (genre && profile && gameContext) {
            const tabs = enhancedInsightService.generateProfileAwareTabsForNewGame(
                genre, 
                profile, 
                gameContext, 
                'paid' // Assume paid for structure generation
            );
            
            const prioritizedTabs = enhancedInsightService.prioritizeTabsForProfile(tabs, profile);
            setInsightTabs(prioritizedTabs);
            
            // Check if this is a new game pill that needs Pro model generation
            const needsGeneration = enhancedInsightService.needsContentGeneration(prioritizedTabs);
            setIsNewGamePill(needsGeneration);
            
            // Check if any tabs need Pro model (only for paid users with new game pills)
            const proTabs = enhancedInsightService.getTabsForProModel(prioritizedTabs, 'paid');
            setNeedsProModel(proTabs.length > 0);
            
            // Initialize insights with placeholders (no API calls)
            const initialInsights: Record<string, EnhancedInsight> = {};
            prioritizedTabs.forEach(tab => {
                initialInsights[tab.id] = {
                    tabId: tab.id,
                    title: tab.title,
                    content: tab.content || 'Content will be generated when you ask for help.',
                    priority: tab.priority,
                    isProfileSpecific: tab.isProfileSpecific,
                    generationModel: tab.generationModel || 'flash',
                    lastUpdated: tab.lastUpdated || Date.now(),
                    status: tab.content ? 'loaded' : 'idle'
                };
            });
            setInsights(initialInsights);
        }
    }, [genre, profile, gameContext]);

    /**
     * Generate insights for a NEW GAME PILL (ONLY when explicitly requested by user)
     * This is the ONLY time we use Gemini 2.5 Pro for paid users
     */
    const generateInsightsForNewGame = useCallback(async (
        gameName: string, 
        genre: string, 
        progress: number, 
        conversationId: string,
        userTier: 'free' | 'paid'
    ) => {
        if (!gameName || !genre || !profile) return;
        
        setIsLoading(true);
        
        try {
            console.log(`🚀 Generating insights for NEW GAME PILL: ${gameName} (${genre}) with ${userTier} tier`);
            
            const results = await profileAwareInsightService.generateInsightsForNewGamePill(
                gameName, 
                genre, 
                progress, 
                conversationId, 
                userTier,
                (error) => console.error('Insight generation error:', error)
            );
            
            // Update insights with generated content
            const updatedInsights: Record<string, EnhancedInsight> = {};
            results.forEach(result => {
                updatedInsights[result.tabId] = {
                    ...result,
                    status: 'loaded'
                };
            });
            
            setInsights(prev => ({ ...prev, ...updatedInsights }));
            
            // Mark as no longer a new game pill
            setIsNewGamePill(false);
            setNeedsProModel(false);
            
            console.log(`✅ Generated ${results.length} insights for new game pill`);
            
        } catch (error) {
            console.error('Error generating insights for new game pill:', error);
            
            // Mark insights as error
            const errorInsights: Record<string, EnhancedInsight> = {};
            insightTabs.forEach(tab => {
                errorInsights[tab.id] = {
                    tabId: tab.id,
                    title: tab.title,
                    content: `Error: Failed to generate content. Ask me about ${tab.title} for help.`,
                    priority: tab.priority,
                    isProfileSpecific: tab.isProfileSpecific,
                    generationModel: 'flash',
                    lastUpdated: Date.now(),
                    status: 'error'
                };
            });
            
            setInsights(prev => ({ ...prev, ...errorInsights }));
        } finally {
            setIsLoading(false);
        }
    }, [profile, insightTabs]);

    /**
     * Update existing insights when user makes explicit queries
     * Always uses Gemini 2.5 Flash for cost optimization
     */
    const updateInsightsForUserQuery = useCallback(async (
        gameName: string, 
        genre: string, 
        progress: number, 
        conversationId: string,
        userTier: 'free' | 'paid'
    ) => {
        if (!gameName || !genre || !profile || !insightTabs.length) return;
        
        setIsLoading(true);
        
        try {
            console.log(`🔄 Updating insights for user query: ${gameName} (${genre}) with ${userTier} tier`);
            
            const results = await profileAwareInsightService.updateInsightsForUserQuery(
                gameName, 
                genre, 
                progress, 
                conversationId,
                insightTabs,
                userTier,
                (error) => console.error('Insight update error:', error)
            );
            
            // Update insights with new content
            const updatedInsights: Record<string, EnhancedInsight> = {};
            results.forEach(result => {
                updatedInsights[result.tabId] = {
                    ...result,
                    status: 'loaded'
                };
            });
            
            setInsights(prev => ({ ...prev, ...updatedInsights }));
            
            console.log(`✅ Updated ${results.length} insights for user query`);
            
        } catch (error) {
            console.error('Error updating insights for user query:', error);
            
            // Mark failed updates as error but keep existing content
            const errorInsights: Record<string, EnhancedInsight> = {};
            insightTabs.forEach(tab => {
                if (insights[tab.id]?.status === 'error') {
                    errorInsights[tab.id] = {
                        ...insights[tab.id],
                        status: 'error',
                        lastUpdated: Date.now()
                    };
                }
            });
            
            setInsights(prev => ({ ...prev, ...errorInsights }));
        } finally {
            setIsLoading(false);
        }
    }, [profile, insightTabs, insights]);

    /**
     * Retry a specific insight (uses Flash model for cost optimization)
     */
    const retryInsight = useCallback(async (
        insightId: string, 
        gameName: string, 
        genre: string, 
        progress: number, 
        conversationId: string,
        userTier: 'free' | 'paid'
    ) => {
        if (!gameName || !genre || !profile) return;
        
        // Mark insight as loading
        setInsights(prev => ({
            ...prev,
            [insightId]: {
                ...prev[insightId],
                status: 'loading'
            }
        }));
        
        try {
            console.log(`🔄 Retrying insight: ${insightId} for ${gameName}`);
            
            // Find the specific tab to retry
            const tabToRetry = insightTabs.find(tab => tab.id === insightId);
            if (!tabToRetry) return;
            
            // Always use Flash model for retries (cost optimization)
            const results = await profileAwareInsightService.updateInsightsForUserQuery(
                gameName, 
                genre, 
                progress, 
                conversationId,
                [tabToRetry], // Only retry this specific tab
                userTier,
                (error) => console.error('Insight retry error:', error)
            );
            
            if (results.length > 0) {
                const result = results[0];
                setInsights(prev => ({
                    ...prev,
                    [insightId]: {
                        ...result,
                        status: 'loaded'
                    }
                }));
                
                console.log(`✅ Retried insight: ${insightId}`);
            }
            
        } catch (error) {
            console.error('Error retrying insight:', error);
            
            // Mark as error
            setInsights(prev => ({
                ...prev,
                [insightId]: {
                    ...prev[insightId],
                    status: 'error',
                    content: `Error: Failed to retry. Ask me about ${insights[insightId]?.title || 'this topic'} for help.`
                }
            }));
        }
    }, [profile, insightTabs, insights]);

    /**
     * Check if insights should be updated (only for explicit user requests)
     */
    const shouldUpdateInsights = useCallback((lastUpdateTime: number): boolean => {
        // No automatic updates - only when user explicitly requests
        return false;
    }, []);

    return {
        insights,
        insightTabs,
        isLoading,
        generateInsightsForNewGame,
        updateInsightsForUserQuery,
        retryInsight,
        shouldUpdateInsights,
        isNewGamePill,
        needsProModel
    };
};
