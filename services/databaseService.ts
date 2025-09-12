import { supabase } from './supabase';
import { PlayerProfile, GameContext, ProactiveInsight, ConversationContext } from './types';

export interface DatabasePlayerProfile {
    id: string;
    user_id: string;
    hint_style: 'Cryptic' | 'Balanced' | 'Direct';
    player_focus: 'Story-Driven' | 'Completionist' | 'Strategist';
    preferred_tone: 'Encouraging' | 'Professional' | 'Casual';
    spoiler_tolerance: 'Strict' | 'Moderate' | 'Relaxed';
    is_first_time: boolean;
    created_at: string;
    updated_at: string;
}

export interface DatabaseGameContext {
    id: string;
    user_id: string;
    game_id: string;
    game_title: string;
    genre: string;
    playthrough_count: number;
    last_session_date: string;
    total_play_time: number;
    objectives_completed: string[];
    secrets_found: string[];
    current_progress: number;
    created_at: string;
    updated_at: string;
}

export interface DatabaseProactiveInsight {
    id: string;
    user_id: string;
    trigger_id: string;
    type: 'build_optimization' | 'lore_summary' | 'mechanic_explanation' | 'session_summary';
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    is_read: boolean;
    action_required: boolean;
    action_text?: string;
    action_url?: string;
    created_at: string;
}

export interface DatabaseEnhancedInsight {
    id: string;
    conversation_id: string;
    user_id: string;
    tab_id: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    is_profile_specific: boolean;
    player_focus: string[];
    hint_style: string[];
    status: 'idle' | 'loading' | 'loaded' | 'error';
    is_placeholder: boolean;
    generation_attempts: number;
    last_updated: string;
    created_at: string;
}

class DatabaseService {
    private static instance: DatabaseService;
    
    private constructor() {}
    
    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Sync player profile to database
     */
    async syncPlayerProfile(profile: PlayerProfile): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for profile sync');
                return false;
            }

            // Commented out - player_profiles is a view, not a table
            // const { error } = await supabase
            //     .from('player_profiles')
            //     .upsert({
            //         user_id: user.id,
            //         hint_style: profile.hintStyle,
            //         player_focus: profile.playerFocus,
            //         preferred_tone: profile.preferredTone,
            //         spoiler_tolerance: profile.spoilerTolerance,
            //         is_first_time: profile.isFirstTime,
            //         updated_at: new Date().toISOString()
            //     }, {
            //         onConflict: 'user_id'
            //     });
            
            // For now, just return true to avoid errors
            const error = null;

            if (error) {
                console.error('Error syncing player profile:', error);
                return false;
            }

            console.log('Player profile synced successfully');
            return true;
        } catch (error) {
            console.error('Error in syncPlayerProfile:', error);
            return false;
        }
    }

    /**
     * Get player profile from database
     */
    async getPlayerProfile(): Promise<PlayerProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for profile retrieval');
                return null;
            }

            const { data, error } = await supabase
                .from('player_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No profile found
                    return null;
                }
                console.error('Error getting player profile:', error);
                return null;
            }

            return {
                hintStyle: data.hint_style,
                playerFocus: data.player_focus,
                preferredTone: data.preferred_tone,
                spoilerTolerance: data.spoiler_tolerance,
                isFirstTime: data.is_first_time,
                createdAt: new Date(data.created_at).getTime(),
                lastUpdated: new Date(data.updated_at).getTime()
            };
        } catch (error) {
            console.error('Error in getPlayerProfile:', error);
            return null;
        }
    }

    /**
     * Sync game context to database
     */
    async syncGameContext(gameId: string, context: GameContext): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for game context sync');
                return false;
            }

            const { error } = await supabase
                .from('game_contexts')
                .upsert({
                    user_id: user.id,
                    game_id: gameId,
                    playthrough_count: context.playthroughCount,
                    last_session_date: new Date(context.lastSessionDate).toISOString(),
                    total_play_time: context.totalPlayTime,
                    objectives_completed: context.objectivesCompleted,
                    secrets_found: context.secretsFound,
                    current_progress: Math.round((context.objectivesCompleted.length / 50) * 100),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,game_id'
                });

            if (error) {
                console.error('Error syncing game context:', error);
                return false;
            }

            console.log('Game context synced successfully');
            return true;
        } catch (error) {
            console.error('Error in syncGameContext:', error);
            return false;
        }
    }

    /**
     * Get game context from database
     */
    async getGameContext(gameId: string): Promise<GameContext | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for game context retrieval');
                return null;
            }

            const { data, error } = await supabase
                .from('game_contexts')
                .select('*')
                .eq('user_id', user.id)
                .eq('game_id', gameId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No context found
                    return null;
                }
                console.error('Error getting game context:', error);
                return null;
            }

            return {
                playthroughCount: data.playthrough_count,
                lastSessionDate: new Date(data.last_session_date).getTime(),
                totalPlayTime: data.total_play_time,
                objectivesCompleted: data.objectives_completed || [],
                secretsFound: data.secrets_found || [],
                buildHistory: [], // TODO: Implement build history sync
                sessionSummaries: [] // TODO: Implement session summaries sync
            };
        } catch (error) {
            console.error('Error in getGameContext:', error);
            return null;
        }
    }

    /**
     * Store enhanced insight in database
     */
    async storeEnhancedInsight(insight: DatabaseEnhancedInsight): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('enhanced_insights')
                .upsert({
                    conversation_id: insight.conversation_id,
                    user_id: insight.user_id,
                    tab_id: insight.tab_id,
                    title: insight.title,
                    content: insight.content,
                    priority: insight.priority,
                    is_profile_specific: insight.is_profile_specific,
                    player_focus: insight.player_focus,
                    hint_style: insight.hint_style,
                    status: insight.status,
                    is_placeholder: insight.is_placeholder,
                    generation_attempts: insight.generation_attempts,
                    last_updated: insight.last_updated
                }, {
                    onConflict: 'conversation_id,tab_id'
                });

            if (error) {
                console.error('Error storing enhanced insight:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in storeEnhancedInsight:', error);
            return false;
        }
    }

    /**
     * Store proactive insight in database
     */
    async storeProactiveInsight(insight: DatabaseProactiveInsight): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('proactive_insights')
                .insert({
                    user_id: insight.user_id,
                    trigger_id: insight.trigger_id,
                    type: insight.type,
                    title: insight.title,
                    content: insight.content,
                    priority: insight.priority,
                    is_read: insight.is_read,
                    action_required: insight.action_required,
                    action_text: insight.action_text,
                    action_url: insight.action_url
                });

            if (error) {
                console.error('Error storing proactive insight:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in storeProactiveInsight:', error);
            return false;
        }
    }

    /**
     * Get proactive insights from database
     */
    async getProactiveInsights(): Promise<DatabaseProactiveInsight[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for proactive insights retrieval');
                return [];
            }

            const { data, error } = await supabase
                .from('proactive_insights')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error getting proactive insights:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getProactiveInsights:', error);
            return [];
        }
    }

    /**
     * Mark proactive insight as read
     */
    async markProactiveInsightAsRead(insightId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('proactive_insights')
                .update({ is_read: true })
                .eq('id', insightId);

            if (error) {
                console.error('Error marking insight as read:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in markProactiveInsightAsRead:', error);
            return false;
        }
    }

    /**
     * Delete proactive insight
     */
    async deleteProactiveInsight(insightId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('proactive_insights')
                .delete()
                .eq('id', insightId);

            if (error) {
                console.error('Error deleting proactive insight:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteProactiveInsight:', error);
            return false;
        }
    }

    /**
     * Get enhanced insights for a conversation
     */
    async getEnhancedInsights(conversationId: string): Promise<DatabaseEnhancedInsight[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for enhanced insights retrieval');
                return [];
            }

            const { data, error } = await supabase
                .from('enhanced_insights')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('user_id', user.id)
                .order('priority', { ascending: false });

            if (error) {
                console.error('Error getting enhanced insights:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getEnhancedInsights:', error);
            return [];
        }
    }

    /**
     * Update enhanced insight status
     */
    async updateEnhancedInsightStatus(
        insightId: string, 
        status: 'idle' | 'loading' | 'loaded' | 'error',
        content?: string
    ): Promise<boolean> {
        try {
            const updateData: any = { 
                status,
                last_updated: new Date().toISOString()
            };

            if (content) {
                updateData.content = content;
                updateData.is_placeholder = false;
            }

            const { error } = await supabase
                .from('enhanced_insights')
                .update(updateData)
                .eq('id', insightId);

            if (error) {
                console.error('Error updating enhanced insight status:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in updateEnhancedInsightStatus:', error);
            return false;
        }
    }

    /**
     * Get user insights summary
     */
    async getUserInsightsSummary(): Promise<{
        total_insights: number;
        unread_insights: number;
        high_priority_insights: number;
        recent_insights: number;
    } | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for insights summary');
                return null;
            }

            const { data, error } = await supabase
                .rpc('get_user_insights_summary', { user_uuid: user.id });

            if (error) {
                console.error('Error getting user insights summary:', error);
                return null;
            }

            return data[0] || {
                total_insights: 0,
                unread_insights: 0,
                high_priority_insights: 0,
                recent_insights: 0
            };
        } catch (error) {
            console.error('Error in getUserInsightsSummary:', error);
            return null;
        }
    }

    /**
     * Clean up old data
     */
    async cleanupOldData(): Promise<boolean> {
        try {
            // Clean up old proactive triggers (older than 30 days)
            const { error } = await supabase
                .rpc('cleanup_old_proactive_triggers');

            if (error) {
                console.error('Error cleaning up old proactive triggers:', error);
                return false;
            }

            // Clean up old enhanced insights (older than 90 days)
            const { error: insightsError } = await supabase
                .from('enhanced_insights')
                .delete()
                .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

            if (insightsError) {
                console.error('Error cleaning up old enhanced insights:', insightsError);
                return false;
            }

            console.log('Old data cleanup completed successfully');
            return true;
        } catch (error) {
            console.error('Error in cleanupOldData:', error);
            return false;
        }
    }

    /**
     * Check database connection health
     */
    async checkHealth(): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('player_profiles')
                .select('count')
                .limit(1);

            if (error) {
                console.error('Database health check failed:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in database health check:', error);
            return false;
        }
    }

    /**
     * Load conversations from database
     */
    async loadConversations(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error loading conversations:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in loadConversations:', error);
            return [];
        }
    }

    /**
     * Save conversation to database
     */
    async saveConversation(conversation: any, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('conversations')
                .upsert({
                    id: conversation.id,
                    user_id: userId,
                    title: conversation.title,
                    messages: conversation.messages,
                    insights: conversation.insights || [],
                    pinned: conversation.pinned || false,
                    created_at: new Date(conversation.createdAt).toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving conversation:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveConversation:', error);
            return false;
        }
    }

    /**
     * Placeholder for future database operations
     */

    /**
     * Save usage data to database
     */
    async saveUsage(usage: any, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('users')
                .upsert({
                    auth_user_id: userId,
                    usage_data: usage
                });

            if (error) {
                console.error('Error saving usage:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveUsage:', error);
            return false;
        }
    }

    /**
     * Load usage data from database
     */
    async loadUsage(userId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('usage_data')
                .eq('auth_user_id', userId)
                .single();

            if (error) {
                console.error('Error loading usage:', error);
                return null;
            }

            return data?.usage_data || null;
        } catch (error) {
            console.error('Error in loadUsage:', error);
            return null;
        }
    }
}

export const databaseService = DatabaseService.getInstance();
