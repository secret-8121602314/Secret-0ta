import { useCallback, useEffect, useState } from 'react';
import { profileAwareInsightService } from '../services/profileAwareInsightService';
import { enhancedInsightService } from '../services/enhancedInsightService';
import { playerProfileService } from '../services/playerProfileService';
import { PlayerProfile, GameContext, EnhancedInsightTab } from '../services/types';

export interface EnhancedInsight {
    id: string;
    title: string;
    content: string;
    isProfileSpecific: boolean;
    priority: 'high' | 'medium' | 'low';
    status: 'idle' | 'loading' | 'loaded' | 'error';
    isPlaceholder: boolean;
    lastUpdated: number;
    generationAttempts: number;
    isNew: boolean;
}

export interface UseEnhancedInsightsReturn {
    insights: Record<string, EnhancedInsight>;
    insightTabs: EnhancedInsightTab[];
    isLoading: boolean;
    generateInsights: (gameName: string, genre: string, progress: number, conversationId: string) => Promise<void>;
    updateInsightsForProfileChange: (gameName: string, genre: string, progress: number, conversationId: string) => Promise<void>;
    retryInsight: (insightId: string, gameName: string, genre: string, progress: number, conversationId: string) => Promise<void>;
    shouldUpdateInsights: (lastUpdateTime: number) => boolean;
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

    // Get player profile and game context
    const profile = playerProfileService.getProfile();
    const gameContext = gameName ? playerProfileService.getGameContext(gameName) : null;

    // Generate profile-aware insight tabs
    useEffect(() => {
        if (genre && profile && gameContext) {
            const tabs = enhancedInsightService.generateProfileAwareTabs(
                genre,
                profile,
                gameContext
            );
            setInsightTabs(tabs);
            
            // Initialize insights with placeholders
            const initialInsights: Record<string, EnhancedInsight> = {};
            tabs.forEach(tab => {
                initialInsights[tab.id] = {
                    id: tab.id,
                    title: tab.title,
                    content: `📋 **${tab.title}**\n\n✨ This insight will be generated with your personalized preferences!\n\n💡 **Click the tab to load profile-aware content**\n\n🎮 Based on your ${profile.playerFocus} focus and ${profile.hintStyle} hint style\n\n⏳ Progress: ${progress || 0}%`,
                    isProfileSpecific: tab.isProfileSpecific,
                    priority: tab.priority,
                    status: 'idle',
                    isPlaceholder: true,
                    lastUpdated: Date.now(),
                    generationAttempts: 0,
                    isNew: false
                };
            });
            setInsights(initialInsights);
        }
    }, [genre, profile, gameContext, progress]);

    // Generate insights progressively with profile awareness
    const generateInsights = useCallback(async (
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string
    ) => {
        if (!profile || !gameContext) {
            console.warn('No profile or game context available for enhanced insights');
            return;
        }

        setIsLoading(true);
        
        try {
            // Get priority-based generation order
            const generationOrder = profileAwareInsightService.getInsightGenerationOrder(insightTabs);
            
            // Generate insights one by one with smart delays
            for (let i = 0; i < generationOrder.length; i++) {
                const tabId = generationOrder[i];
                const tab = insightTabs.find(t => t.id === tabId);
                
                if (!tab) continue;
                
                // Skip if already generated
                if (insights[tabId]?.status === 'loaded' && !insights[tabId]?.isPlaceholder) {
                    continue;
                }
                
                try {
                    // Update status to loading
                    setInsights(prev => ({
                        ...prev,
                        [tabId]: {
                            ...prev[tabId],
                            status: 'loading',
                            content: '🔄 Generating personalized content...'
                        }
                    }));
                    
                    // Generate content using profile-aware service
                    const result = await profileAwareInsightService.generateProfileAwareInsights(
                        gameName,
                        genre,
                        progress,
                        conversationId,
                        (error) => console.error(`Error generating ${tab.title}:`, error)
                    );
                    
                    // Find the generated content for this tab
                    const generatedInsight = result.find(r => r.tabId === tabId);
                    
                    if (generatedInsight) {
                        // Update with real content
                        setInsights(prev => ({
                            ...prev,
                            [tabId]: {
                                ...prev[tabId],
                                content: generatedInsight.content,
                                status: 'loaded',
                                isPlaceholder: false,
                                lastUpdated: generatedInsight.lastUpdated,
                                isNew: true
                            }
                        }));
                    }
                    
                    // Smart delay between generations based on priority
                    if (i < generationOrder.length - 1) {
                        const currentTab = insightTabs.find(t => t.id === tabId);
                        const nextTab = insightTabs.find(t => t.id === generationOrder[i + 1]);
                        
                        let delay = 2000; // Default 2 seconds
                        
                        // High priority tabs get faster generation
                        if (currentTab?.priority === 'high') {
                            delay = 1000;
                        } else if (currentTab?.priority === 'low') {
                            delay = 3000;
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    
                } catch (error) {
                    console.warn(`Failed to generate ${tab.title}:`, error);
                    
                    // Mark as failed but keep placeholder for retry
                    setInsights(prev => ({
                        ...prev,
                        [tabId]: {
                            ...prev[tabId],
                            status: 'error',
                            content: `❌ Failed to generate ${tab.title}\n\n💡 Click the tab to retry with your personalized preferences!`,
                            generationAttempts: (prev[tabId]?.generationAttempts || 0) + 1
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Enhanced insight generation failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [profile, gameContext, insightTabs, insights]);

    // Update insights when profile changes
    const updateInsightsForProfileChange = useCallback(async (
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string
    ) => {
        console.log('Updating insights due to profile change');
        
        // Regenerate all insights with new profile
        setInsights({}); // Clear existing insights
        await generateInsights(gameName, genre, progress, conversationId);
    }, [generateInsights]);

    // Retry failed insight generation
    const retryInsight = useCallback(async (
        insightId: string,
        gameName: string,
        genre: string,
        progress: number,
        conversationId: string
    ) => {
        if (!profile || !gameContext) return;
        
        const tab = insightTabs.find(t => t.id === insightId);
        if (!tab) return;
        
        try {
            // Update status to loading
            setInsights(prev => ({
                ...prev,
                [insightId]: {
                    ...prev[insightId],
                    status: 'loading',
                    content: '🔄 Retrying with your personalized preferences...'
                }
            }));
            
            // Generate content for this specific tab
            const result = await profileAwareInsightService.generateProfileAwareInsights(
                gameName,
                genre,
                progress,
                conversationId,
                (error) => console.error(`Error retrying ${tab.title}:`, error)
            );
            
            const generatedInsight = result.find(r => r.tabId === insightId);
            
            if (generatedInsight) {
                setInsights(prev => ({
                    ...prev,
                    [insightId]: {
                        ...prev[insightId],
                        content: generatedInsight.content,
                        status: 'loaded',
                        isPlaceholder: false,
                        lastUpdated: generatedInsight.lastUpdated,
                        isNew: true
                    }
                }));
            }
            
        } catch (error) {
            console.error(`Failed to retry ${insightId}:`, error);
            
            setInsights(prev => ({
                ...prev,
                [insightId]: {
                    ...prev[insightId],
                    status: 'error',
                    content: `❌ Failed to retry ${tab.title}\n\n💡 Please try again later!`,
                    generationAttempts: (prev[insightId]?.generationAttempts || 0) + 1
                }
            }));
        }
    }, [profile, gameContext, insightTabs]);

    // Check if insights need updating
    const shouldUpdateInsights = useCallback((lastUpdateTime: number): boolean => {
        if (!profile || !gameContext) return false;
        
        return profileAwareInsightService.shouldUpdateInsights(
            profile,
            gameContext,
            lastUpdateTime
        );
    }, [profile, gameContext]);

    return {
        insights,
        insightTabs,
        isLoading,
        generateInsights,
        updateInsightsForProfileChange,
        retryInsight,
        shouldUpdateInsights
    };
};
