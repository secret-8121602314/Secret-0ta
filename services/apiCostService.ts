/**
 * API Cost Service - Monitors and optimizes API usage for cost control
 * 
 * This service ensures we only make API calls when explicitly requested by users
 * and uses the most cost-effective models for different use cases.
 * 
 * ADMIN ONLY: All cost data is synced to Supabase for admin monitoring
 */

import { supabase } from './supabase';
import { supabaseDataService } from './supabaseDataService';

export interface APICallRecord {
    timestamp: number;
    model: 'flash' | 'pro';
    purpose: 'new_game_pill' | 'user_query' | 'insight_update' | 'retry' | 'chat_message';
    userTier: 'free' | 'paid';
    cost: number; // Estimated cost in USD
    success: boolean;
    errorMessage?: string;
    conversationId?: string;
    gameName?: string;
    genre?: string;
    progress?: number;
    metadata?: Record<string, any>;
}

export interface APICostSummary {
    totalCalls: number;
    totalCost: number;
    callsByModel: Record<'flash' | 'pro', number>;
    callsByPurpose: Record<string, number>;
    callsByTier: Record<'free' | 'paid', number>;
    lastCall: number;
    estimatedMonthlyCost: number;
}

class APICostService {
    private static instance: APICostService;
    private readonly COST_KEY = 'otakon_api_cost_records';
    private readonly MAX_RECORDS = 100; // Keep last 100 calls locally for offline fallback
    
    // Estimated costs per 1K tokens (approximate)
    private readonly COST_PER_1K_TOKENS = {
        'flash': 0.000075, // $0.075 per 1M tokens
        'pro': 0.000375    // $0.375 per 1M tokens
    };
    
    private constructor() {}
    
    static getInstance(): APICostService {
        if (!APICostService.instance) {
            APICostService.instance = new APICostService();
        }
        return APICostService.instance;
    }

    /**
     * Record an API call for cost tracking (syncs to Supabase)
     */
    async recordAPICall(
        model: 'flash' | 'pro',
        purpose: 'new_game_pill' | 'user_query' | 'insight_update' | 'retry' | 'chat_message',
        userTier: 'free' | 'paid',
        estimatedTokens: number = 1000, // Default estimate
        success: boolean = true,
        errorMessage?: string,
        conversationId?: string,
        gameName?: string,
        genre?: string,
        progress?: number,
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const record: APICallRecord = {
                timestamp: Date.now(),
                model,
                purpose,
                userTier,
                cost: this.calculateCost(model, estimatedTokens),
                success,
                errorMessage,
                conversationId,
                gameName,
                genre,
                progress,
                metadata
            };

            // Store locally for offline fallback
            this.storeLocally(record);

            // Sync to Supabase (admin monitoring)
            await this.syncToSupabase(record);
            
            console.log(`💰 API Call Recorded: ${model} model for ${purpose} (${userTier} user) - Cost: $${record.cost.toFixed(6)}`);
            
        } catch (error) {
            console.error('Error recording API call:', error);
            // Still store locally even if Supabase sync fails
        }
    }

    /**
     * Calculate estimated cost for a model and token count
     */
    private calculateCost(model: 'flash' | 'pro', tokens: number): number {
        const costPer1K = this.COST_PER_1K_TOKENS[model];
        return (tokens / 1000) * costPer1K;
    }

    /**
     * Store record locally for offline fallback
     */
    private storeLocally(record: APICallRecord): void {
        try {
            const records = this.getLocalAPICallRecords();
            records.push(record);

            // Keep only the last MAX_RECORDS
            if (records.length > this.MAX_RECORDS) {
                records.splice(0, records.length - this.MAX_RECORDS);
            }

            localStorage.setItem(this.COST_KEY, JSON.stringify(records));
        } catch (error) {
            console.error('Error storing API call locally:', error);
        }
    }

    /**
     * Sync record to Supabase for admin monitoring
     */
    private async syncToSupabase(record: APICallRecord): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user for API cost tracking');
                return;
            }

            const { error } = await supabase
                .from('analytics_new')
                .insert({
                    user_id: user.id,
                    category: 'api_costs',
                    event_type: 'api_call',
                    data: {
                        timestamp: new Date(record.timestamp).toISOString(),
                        model: record.model,
                        purpose: record.purpose,
                        user_tier: record.userTier,
                        estimated_tokens: 1000, // Default estimate since not in record
                        estimated_cost: record.cost,
                        success: record.success,
                        error_message: record.errorMessage,
                        conversation_id: record.conversationId,
                        game_name: record.gameName,
                        genre: record.genre,
                        progress: record.progress,
                        metadata: record.metadata || {}
                    }
                });

            if (error) {
                console.error('Error syncing API cost to Supabase:', error);
            }
        } catch (error) {
            console.error('Error in Supabase sync:', error);
        }
    }

    /**
     * Get local API call records (offline fallback)
     */
    private getLocalAPICallRecords(): APICallRecord[] {
        try {
            const stored = localStorage.getItem(this.COST_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading local API call records:', error);
            return [];
        }
    }

    /**
     * Get cost summary from Supabase (admin only)
     */
    async getCostSummary(): Promise<APICostSummary> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from('users_new')
                .select('profile_data')
                .eq('auth_user_id', user.id)
                .single();

            if (!profile?.profile_data?.is_admin) {
                throw new Error('Admin access required for cost summary');
            }

            // Get last 30 days of data
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: records, error } = await supabase
                .from('analytics_new')
                .select('*')
                .eq('category', 'api_costs')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return this.processCostSummary(records || []);
        } catch (error) {
            console.error('Error getting cost summary from Supabase:', error);
            // Fallback to local data
            return this.getLocalCostSummary();
        }
    }

    /**
     * Process cost summary from Supabase data
     */
    private processCostSummary(records: any[]): APICostSummary {
        const callsByModel: Record<'flash' | 'pro', number> = { flash: 0, pro: 0 };
        const callsByPurpose: Record<string, number> = {};
        const callsByTier: Record<'free' | 'paid', number> = { free: 0, paid: 0 };

        let totalCost = 0;

        records.forEach(record => {
            const data = record.data;
            if (data.model === 'flash' || data.model === 'pro') {
                callsByModel[data.model as 'flash' | 'pro']++;
            }
            if (typeof data.purpose === 'string') {
                callsByPurpose[data.purpose] = (callsByPurpose[data.purpose] || 0) + 1;
            }
            if (data.user_tier === 'free' || data.user_tier === 'paid') {
                callsByTier[data.user_tier as 'free' | 'paid']++;
            }
            totalCost += parseFloat(data.estimated_cost);
        });

        // Estimate monthly cost based on 30-day average
        const estimatedMonthlyCost = totalCost * (30 / 30); // Simple projection

        return {
            totalCalls: records.length,
            totalCost,
            callsByModel,
            callsByPurpose,
            callsByTier,
            lastCall: records.length > 0 ? new Date(records[0].created_at).getTime() : 0,
            estimatedMonthlyCost
        };
    }

    /**
     * Get local cost summary (offline fallback)
     */
    private getLocalCostSummary(): APICostSummary {
        const records = this.getLocalAPICallRecords();
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Filter records from last 30 days
        const recentRecords = records.filter(record => record.timestamp > thirtyDaysAgo);

        const callsByModel: Record<'flash' | 'pro', number> = { flash: 0, pro: 0 };
        const callsByPurpose: Record<string, number> = {};
        const callsByTier: Record<'free' | 'paid', number> = { free: 0, paid: 0 };

        let totalCost = 0;

        recentRecords.forEach(record => {
            if (record.model === 'flash' || record.model === 'pro') {
                callsByModel[record.model]++;
            }
            callsByPurpose[record.purpose] = (callsByPurpose[record.purpose] || 0) + 1;
            if (record.userTier === 'free' || record.userTier === 'paid') {
                callsByTier[record.userTier]++;
            }
            totalCost += record.cost;
        });

        // Estimate monthly cost based on 30-day average
        const estimatedMonthlyCost = totalCost * (30 / 30); // Simple projection

        return {
            totalCalls: recentRecords.length,
            totalCost,
            callsByModel,
            callsByPurpose,
            callsByTier,
            lastCall: records.length > 0 ? records[records.length - 1].timestamp : 0,
            estimatedMonthlyCost
        };
    }

    /**
     * Get cost breakdown by model from Supabase (admin only)
     */
    async getModelCostBreakdown(): Promise<{ flash: number; pro: number }> {
        try {
            const summary = await this.getCostSummary();
            return summary.callsByModel;
        } catch (error) {
            console.error('Error getting model cost breakdown:', error);
            return { flash: 0, pro: 0 };
        }
    }

    /**
     * Get usage recommendations for cost optimization (admin only)
     */
    async getCostOptimizationRecommendations(): Promise<string[]> {
        try {
            const summary = await this.getCostSummary();
            const recommendations: string[] = [];

            // Check Pro model usage
            if (summary.callsByModel.pro > summary.callsByModel.flash * 0.1) {
                recommendations.push('Consider using Flash model more frequently for cost optimization');
            }

            // Check new game pill frequency
            if (summary.callsByPurpose.new_game_pill > summary.totalCalls * 0.2) {
                recommendations.push('New game pill generation is high - ensure this only happens when explicitly requested');
            }

            // Check free user API usage
            if (summary.callsByTier.free > 0) {
                recommendations.push('Free users should not generate API calls - review implementation');
            }

            // Check overall cost
            if (summary.estimatedMonthlyCost > 10) {
                recommendations.push('Monthly API cost is high - review usage patterns and optimize');
            }

            return recommendations.length > 0 ? recommendations : ['API usage is within optimal ranges'];
        } catch (error) {
            console.error('Error getting cost optimization recommendations:', error);
            return ['Unable to generate recommendations'];
        }
    }

    /**
     * Export cost data for analysis (admin only)
     */
    async exportCostData(): Promise<string> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('user_id', user.id)
                .single();

            if (!profile?.is_admin) {
                throw new Error('Admin access required for data export');
            }

            const { data: records, error } = await supabase
                .from('api_cost_tracking')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) {
                throw error;
            }

            const csv = [
                'Timestamp,Model,Purpose,UserTier,EstimatedTokens,EstimatedCost,Success,ErrorMessage,ConversationId,GameName,Genre,Progress',
                ...(records || []).map(record => 
                    `${record.timestamp},${record.model},${record.purpose},${record.user_tier},${record.estimated_tokens},${record.estimated_cost},${record.success},${record.error_message || ''},${record.conversation_id || ''},${record.game_name || ''},${record.genre || ''},${record.progress || ''}`
                )
            ].join('\n');

            return csv;
        } catch (error) {
            console.error('Error exporting cost data:', error);
            return '';
        }
    }

    /**
     * Cleanup old records (admin only)
     */
    async cleanupOldRecords(daysToKeep: number = 90): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('user_id', user.id)
                .single();

            if (!profile?.is_admin) {
                throw new Error('Admin access required for cleanup');
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const { error } = await supabase
                .from('api_cost_tracking')
                .delete()
                .lt('timestamp', cutoffDate.toISOString());

            if (error) {
                throw error;
            }

            console.log(`🧹 Cleaned up old API cost records older than ${daysToKeep} days`);
        } catch (error) {
            console.error('Error cleaning up old records:', error);
        }
    }

    /**
     * Reset all cost tracking (admin only - for testing/debugging)
     */
    async resetCostTracking(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user');
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('user_id', user.id)
                .single();

            if (!profile?.is_admin) {
                throw new Error('Admin access required for reset');
            }

            // Clear Supabase data
            const { error } = await supabase
                .from('api_cost_tracking')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) {
                throw error;
            }

            // Clear local data
            localStorage.removeItem(this.COST_KEY);
            
            console.log('🔄 API cost tracking reset');
        } catch (error) {
            console.error('Error resetting cost tracking:', error);
        }
    }

    // Get cost records from Supabase with localStorage fallback
    private async getCostRecords(): Promise<any[]> {
        try {
            // Try to get from Supabase first
            const appState = await supabaseDataService.getUserAppState();
            const costRecords = appState.apiCostRecords;
            
            if (costRecords && Array.isArray(costRecords)) {
                return costRecords;
            }
            
            // Fallback to localStorage
            const localRecords = localStorage.getItem(this.COST_KEY);
            return localRecords ? JSON.parse(localRecords) : [];
        } catch (error) {
            console.warn('Failed to get cost records from Supabase, using localStorage fallback:', error);
            
            // Fallback to localStorage only
            const localRecords = localStorage.getItem(this.COST_KEY);
            return localRecords ? JSON.parse(localRecords) : [];
        }
    }

    // Set cost records in Supabase with localStorage fallback
    private async setCostRecords(records: any[]): Promise<void> {
        try {
            // Update in Supabase
            await supabaseDataService.updateUserAppState('apiCostRecords', records);
            
            // Also update localStorage as backup
            localStorage.setItem(this.COST_KEY, JSON.stringify(records));
        } catch (error) {
            console.warn('Failed to update cost records in Supabase, using localStorage only:', error);
            
            // Fallback to localStorage only
            localStorage.setItem(this.COST_KEY, JSON.stringify(records));
        }
    }
}

export const apiCostService = APICostService.getInstance();
