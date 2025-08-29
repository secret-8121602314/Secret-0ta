import { ProactiveInsight, PlayerProfile, GameContext, ConversationContext } from './types';
import { playerProfileService } from './playerProfileService';
import { contextManagementService } from './contextManagementService';
import { supabaseDataService } from './supabaseDataService';

export interface ProactiveTrigger {
    type: 'objective_complete' | 'inventory_change' | 'area_discovery' | 'session_start' | 'session_end' | 'progress_milestone' | 'difficulty_spike' | 'exploration_pattern';
    gameId: string;
    timestamp: number;
    metadata: Record<string, any>;
    priority: 'low' | 'medium' | 'high';
}

export interface ProactiveInsightSuggestion {
    id: string;
    type: ProactiveInsight['type'];
    title: string;
    content: string;
    trigger: ProactiveTrigger;
    priority: 'low' | 'medium' | 'high';
    timestamp: number;
    isRead: boolean;
    actionRequired: boolean;
    actionText?: string;
    actionUrl?: string;
}

class ProactiveInsightService {
    private static instance: ProactiveInsightService;
    private readonly PROACTIVE_INSIGHTS_KEY = 'otakon_proactive_insights';
    private readonly TRIGGER_HISTORY_KEY = 'otakon_trigger_history';
    
    private constructor() {}
    
    static getInstance(): ProactiveInsightService {
        if (!ProactiveInsightService.instance) {
            ProactiveInsightService.instance = new ProactiveInsightService();
        }
        return ProactiveInsightService.instance;
    }

    /**
     * Process a proactive trigger and generate insights
     */
    async processProactiveTrigger(trigger: ProactiveTrigger): Promise<ProactiveInsightSuggestion[]> {
        try {
            const profile = playerProfileService.getProfile();
            const gameContext = playerProfileService.getGameContext(trigger.gameId);
            
            if (!profile || !gameContext) {
                console.warn('No profile or game context available for proactive insights');
                return [];
            }

            // Store trigger in history
            await this.storeTrigger(trigger);
            
            // Generate insights based on trigger type and profile
            const insights = await this.generateInsightsForTrigger(trigger, await profile, await gameContext);
            
            // Store generated insights
            this.storeProactiveInsights(insights);
            
            return insights;
            
        } catch (error) {
            console.error('Error processing proactive trigger:', error);
            return [];
        }
    }

    /**
     * Generate insights based on trigger type and player profile
     */
    public async generateInsightsForTrigger(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): Promise<ProactiveInsightSuggestion[]> {
        const insights: ProactiveInsightSuggestion[] = [];
        
        switch (trigger.type) {
            case 'objective_complete':
                insights.push(...this.generateObjectiveCompleteInsights(trigger, profile, gameContext));
                break;
                
            case 'inventory_change':
                insights.push(...this.generateInventoryChangeInsights(trigger, profile, gameContext));
                break;
                
            case 'area_discovery':
                insights.push(...this.generateAreaDiscoveryInsights(trigger, profile, gameContext));
                break;
                
            case 'session_start':
                insights.push(...this.generateSessionStartInsights(trigger, profile, gameContext));
                break;
                
            case 'session_end':
                insights.push(...this.generateSessionEndInsights(trigger, profile, gameContext));
                break;
                
            case 'progress_milestone':
                insights.push(...this.generateProgressMilestoneInsights(trigger, profile, gameContext));
                break;
                
            case 'difficulty_spike':
                insights.push(...this.generateDifficultySpikeInsights(trigger, profile, gameContext));
                break;
                
            case 'exploration_pattern':
                insights.push(...this.generateExplorationPatternInsights(trigger, profile, gameContext));
                break;
        }
        
        return insights;
    }

    /**
     * Generate insights when objectives are completed
     */
    private generateObjectiveCompleteInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        // Story-Driven focus insights
        if (profile.playerFocus === 'Story-Driven') {
            insights.push({
                id: `obj_complete_story_${Date.now()}`,
                type: 'lore_summary',
                title: 'Story Progress Update',
                content: `🎭 **Objective Complete!**\n\nYou've made significant progress in the story. Based on your ${profile.hintStyle.toLowerCase()} preferences, here's what this means for your journey...`,
                trigger,
                priority: 'high',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        // Completionist focus insights
        if (profile.playerFocus === 'Completionist') {
            insights.push({
                id: `obj_complete_completion_${Date.now()}`,
                type: 'build_optimization',
                title: 'Completion Progress',
                content: `🏆 **Objective Complete!**\n\nGreat progress toward completion! You're now ${Math.round((gameContext.objectivesCompleted.length / 50) * 100)}% through the main objectives.`,
                trigger,
                priority: 'medium',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        // Strategist focus insights
        if (profile.playerFocus === 'Strategist') {
            insights.push({
                id: `obj_complete_strategy_${Date.now()}`,
                type: 'build_optimization',
                title: 'Strategic Achievement',
                content: `⚔️ **Objective Complete!**\n\nExcellent strategic execution! This objective completion opens up new tactical opportunities.`,
                trigger,
                priority: 'medium',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        return insights;
    }

    /**
     * Generate insights when inventory changes significantly
     */
    private generateInventoryChangeInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const newItems = trigger.metadata.newItems || [];
        const removedItems = trigger.metadata.removedItems || [];
        
        if (newItems.length > 0) {
            // Strategist focus insights
            if (profile.playerFocus === 'Strategist') {
                insights.push({
                    id: `inventory_strategy_${Date.now()}`,
                    type: 'build_optimization',
                    title: 'New Equipment Analysis',
                    content: `🔧 **New Equipment Acquired!**\n\nYou've obtained ${newItems.length} new item(s). Based on your strategic focus, here are the optimal ways to integrate them into your build...`,
                    trigger,
                    priority: 'high',
                    timestamp: Date.now(),
                    isRead: false,
                    actionRequired: true,
                    actionText: 'View Build Guide',
                    actionUrl: `#build_guide`
                });
            }
            
            // Completionist focus insights
            if (profile.playerFocus === 'Completionist') {
                insights.push({
                    id: `inventory_completion_${Date.now()}`,
                    type: 'build_optimization',
                    title: 'Collection Progress',
                    content: `📦 **New Items Added!**\n\nYour collection is growing! You now have ${gameContext.secretsFound.length} unique items.`,
                    trigger,
                    priority: 'medium',
                    timestamp: Date.now(),
                    isRead: false,
                    actionRequired: false
                });
            }
        }
        
        return insights;
    }

    /**
     * Generate insights when new areas are discovered
     */
    private generateAreaDiscoveryInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const areaName = trigger.metadata.areaName || 'new area';
        
        // Story-Driven focus insights
        if (profile.playerFocus === 'Story-Driven') {
            insights.push({
                id: `area_story_${Date.now()}`,
                type: 'lore_summary',
                title: 'New Area Discovered',
                content: `🗺️ **${areaName} Discovered!**\n\nThis new area holds secrets that could deepen your understanding of the story. Based on your ${profile.hintStyle.toLowerCase()} preferences, here's what to look for...`,
                trigger,
                priority: 'high',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        // Completionist focus insights
        if (profile.playerFocus === 'Completionist') {
            insights.push({
                id: `area_completion_${Date.now()}`,
                type: 'build_optimization',
                title: 'Exploration Opportunity',
                content: `🔍 **${areaName} Discovered!**\n\nNew exploration territory! This area likely contains collectibles and secrets.`,
                trigger,
                priority: 'medium',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        return insights;
    }

    /**
     * Generate insights when a session starts
     */
    private generateSessionStartInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const lastSession = gameContext.sessionSummaries[gameContext.sessionSummaries.length - 1];
        const timeSinceLastSession = lastSession ? Date.now() - lastSession.date : 0;
        const daysSinceLastSession = Math.floor(timeSinceLastSession / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastSession > 7) {
            // Welcome back insights
            insights.push({
                id: `session_welcome_${Date.now()}`,
                type: 'session_summary',
                title: 'Welcome Back!',
                content: `🎮 **Welcome back to your adventure!**\n\nIt's been ${daysSinceLastSession} days since your last session. Here's a quick recap of where you left off...`,
                trigger,
                priority: 'high',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        // Session planning insights based on profile
        if (profile.playerFocus === 'Story-Driven') {
            insights.push({
                id: `session_story_${Date.now()}`,
                type: 'session_summary',
                title: 'Story Session Planning',
                content: `📖 **Story Session Planning**\n\nBased on your story-driven focus, here are the key narrative elements to focus on in this session...`,
                trigger,
                priority: 'medium',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        return insights;
    }

    /**
     * Generate insights when a session ends
     */
    private generateSessionEndInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const sessionDuration = trigger.metadata.duration || 0;
        const objectivesCompleted = trigger.metadata.objectivesCompleted || [];
        const discoveries = trigger.metadata.discoveries || [];
        
        // Session summary insights
        insights.push({
            id: `session_summary_${Date.now()}`,
            type: 'session_summary',
            title: 'Session Summary',
            content: `📊 **Session Complete!**\n\n**Duration:** ${Math.round(sessionDuration / 60000)} minutes\n**Objectives:** ${objectivesCompleted.length} completed\n**Discoveries:** ${discoveries.length} new findings\n\nGreat progress!`,
            trigger,
            priority: 'medium',
            timestamp: Date.now(),
            isRead: false,
            actionRequired: false
        });
        
        // Next session planning
        if (profile.playerFocus === 'Strategist') {
            insights.push({
                id: `session_next_strategy_${Date.now()}`,
                type: 'build_optimization',
                title: 'Next Session Strategy',
                content: `⚔️ **Strategic Planning**\n\nBased on this session's progress, here are the optimal strategies to focus on in your next session...`,
                trigger,
                priority: 'medium',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        return insights;
    }

    /**
     * Generate insights for progress milestones
     */
    private generateProgressMilestoneInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const milestone = trigger.metadata.milestone || 'progress milestone';
        const progress = trigger.metadata.progress || 0;
        
        // Milestone celebration
        insights.push({
            id: `milestone_${Date.now()}`,
            type: 'session_summary',
            title: `🎯 ${milestone} Achieved!`,
            content: `🎉 **Congratulations!**\n\nYou've reached ${milestone} at ${progress}% completion! This is a significant achievement in your journey.`,
            trigger,
            priority: 'high',
            timestamp: Date.now(),
            isRead: false,
            actionRequired: false
        });
        
        return insights;
    }

    /**
     * Generate insights for difficulty spikes
     */
    private generateDifficultySpikeInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const challengeType = trigger.metadata.challengeType || 'difficulty spike';
        
        // Difficulty assistance
        insights.push({
            id: `difficulty_${Date.now()}`,
            type: 'build_optimization',
            title: 'Challenge Ahead',
            content: `⚡ **${challengeType} Detected!**\n\nYou're approaching a challenging section. Based on your ${profile.playerFocus.toLowerCase()} focus, here are some strategies to help you overcome this...`,
            trigger,
            priority: 'high',
            timestamp: Date.now(),
            isRead: false,
            actionRequired: true,
            actionText: 'Get Strategy Tips',
            actionUrl: `#boss_strategy`
        });
        
        return insights;
    }

    /**
     * Generate insights for exploration patterns
     */
    private generateExplorationPatternInsights(
        trigger: ProactiveTrigger,
        profile: PlayerProfile,
        gameContext: GameContext
    ): ProactiveInsightSuggestion[] {
        const insights: ProactiveInsightSuggestion[] = [];
        
        const pattern = trigger.metadata.pattern || 'exploration pattern';
        
        // Exploration optimization
        if (profile.playerFocus === 'Completionist') {
            insights.push({
                id: `exploration_${Date.now()}`,
                type: 'build_optimization',
                title: 'Exploration Optimization',
                content: `🗺️ **Exploration Pattern Detected!**\n\nI've noticed your exploration style. Here are some tips to ensure you don't miss any secrets in this area...`,
                trigger,
                priority: 'medium',
                timestamp: Date.now(),
                isRead: false,
                actionRequired: false
            });
        }
        
        return insights;
    }

    /**
     * Get all proactive insights for a user
     */
    getProactiveInsights(): ProactiveInsightSuggestion[] {
        try {
            const stored = localStorage.getItem(this.PROACTIVE_INSIGHTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading proactive insights:', error);
            return [];
        }
    }

    /**
     * Mark an insight as read
     */
    markInsightAsRead(insightId: string): void {
        try {
            const insights = this.getProactiveInsights();
            const updatedInsights = insights.map(insight => 
                insight.id === insightId 
                    ? { ...insight, isRead: true }
                    : insight
            );
            this.storeProactiveInsights(updatedInsights);
        } catch (error) {
            console.error('Error marking insight as read:', error);
        }
    }

    /**
     * Delete an insight
     */
    deleteInsight(insightId: string): void {
        try {
            const insights = this.getProactiveInsights();
            const updatedInsights = insights.filter(insight => insight.id !== insightId);
            this.storeProactiveInsights(updatedInsights);
        } catch (error) {
            console.error('Error deleting insight:', error);
        }
    }

    /**
     * Get unread insights count
     */
    getUnreadInsightsCount(): number {
        const insights = this.getProactiveInsights();
        return insights.filter(insight => !insight.isRead).length;
    }

    /**
     * Get high priority insights
     */
    getHighPriorityInsights(): ProactiveInsightSuggestion[] {
        const insights = this.getProactiveInsights();
        return insights.filter(insight => insight.priority === 'high' && !insight.isRead);
    }

    /**
     * Store proactive insights
     */
    private storeProactiveInsights(insights: ProactiveInsightSuggestion[]): void {
        try {
            localStorage.setItem(this.PROACTIVE_INSIGHTS_KEY, JSON.stringify(insights));
        } catch (error) {
            console.error('Error storing proactive insights:', error);
        }
    }

    /**
     * Store trigger history
     */
    private async storeTrigger(trigger: ProactiveTrigger): Promise<void> {
        try {
            const history = await this.getTriggerHistory();
            history.push(trigger);
            
            // Keep only last 100 triggers
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            await this.setTriggerHistory(history);
        } catch (error) {
            console.error('Error storing trigger history:', error);
        }
    }

    /**
     * Set trigger history in Supabase with localStorage fallback
     */
    private async setTriggerHistory(history: any): Promise<void> {
        try {
            // Get existing data
            const appState = await supabaseDataService.getUserAppState();
            const existingData = appState.proactiveInsights || {};
            
            // Update with new history
            const updatedData = {
                ...existingData,
                triggerHistory: history
            };
            
            // Update in Supabase
            await supabaseDataService.updateUserAppState('proactiveInsights', updatedData);
            
            // Also update localStorage as backup
            localStorage.setItem(this.TRIGGER_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.warn('Failed to update trigger history in Supabase, using localStorage only:', error);
            
            // Fallback to localStorage only
            localStorage.setItem(this.TRIGGER_HISTORY_KEY, JSON.stringify(history));
        }
    }

    /**
     * Get trigger history for analytics
     */
    getTriggerHistory(): ProactiveTrigger[] {
        try {
            const stored = localStorage.getItem(this.TRIGGER_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading trigger history:', error);
            return [];
        }
    }

    /**
     * Clear old insights (older than 30 days)
     */
    cleanupOldInsights(): void {
        try {
            const insights = this.getProactiveInsights();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const recentInsights = insights.filter(insight => insight.timestamp > thirtyDaysAgo);
            
            if (recentInsights.length !== insights.length) {
                this.storeProactiveInsights(recentInsights);
                console.log(`Cleaned up ${insights.length - recentInsights.length} old insights`);
            }
        } catch (error) {
            console.error('Error cleaning up old insights:', error);
        }
    }
}

export const proactiveInsightService = ProactiveInsightService.getInstance();
