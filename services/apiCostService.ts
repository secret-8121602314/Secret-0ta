/**
 * API Cost Service - Monitors and optimizes API usage for cost control
 * 
 * This service ensures we only make API calls when explicitly requested by users
 * and uses the most cost-effective models for different use cases.
 */

export interface APICallRecord {
    timestamp: number;
    model: 'flash' | 'pro';
    purpose: 'new_game_pill' | 'user_query' | 'insight_update' | 'retry';
    userTier: 'free' | 'paid';
    cost: number; // Estimated cost in USD
    success: boolean;
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
    private readonly MAX_RECORDS = 1000; // Keep last 1000 calls
    
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
     * Record an API call for cost tracking
     */
    recordAPICall(
        model: 'flash' | 'pro',
        purpose: 'new_game_pill' | 'user_query' | 'insight_update' | 'retry',
        userTier: 'free' | 'paid',
        estimatedTokens: number = 1000, // Default estimate
        success: boolean = true
    ): void {
        try {
            const record: APICallRecord = {
                timestamp: Date.now(),
                model,
                purpose,
                userTier,
                cost: this.calculateCost(model, estimatedTokens),
                success
            };

            const records = this.getAPICallRecords();
            records.push(record);

            // Keep only the last MAX_RECORDS
            if (records.length > this.MAX_RECORDS) {
                records.splice(0, records.length - this.MAX_RECORDS);
            }

            localStorage.setItem(this.COST_KEY, JSON.stringify(records));
            
            console.log(`💰 API Call Recorded: ${model} model for ${purpose} (${userTier} user) - Cost: $${record.cost.toFixed(6)}`);
            
        } catch (error) {
            console.error('Error recording API call:', error);
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
     * Get all API call records
     */
    private getAPICallRecords(): APICallRecord[] {
        try {
            const stored = localStorage.getItem(this.COST_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading API call records:', error);
            return [];
        }
    }

    /**
     * Get cost summary for monitoring
     */
    getCostSummary(): APICostSummary {
        const records = this.getAPICallRecords();
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Filter records from last 30 days
        const recentRecords = records.filter(record => record.timestamp > thirtyDaysAgo);

        const callsByModel: Record<'flash' | 'pro', number> = { flash: 0, pro: 0 };
        const callsByPurpose: Record<string, number> = {};
        const callsByTier: Record<'free' | 'paid', number> = { free: 0, paid: 0 };

        let totalCost = 0;

        recentRecords.forEach(record => {
            callsByModel[record.model]++;
            callsByPurpose[record.purpose] = (callsByPurpose[record.purpose] || 0) + 1;
            callsByTier[record.userTier]++;
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
     * Get cost breakdown by model
     */
    getModelCostBreakdown(): { flash: number; pro: number } {
        const records = this.getAPICallRecords();
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        const recentRecords = records.filter(record => record.timestamp > thirtyDaysAgo);
        
        let flashCost = 0;
        let proCost = 0;

        recentRecords.forEach(record => {
            if (record.model === 'flash') {
                flashCost += record.cost;
            } else {
                proCost += record.cost;
            }
        });

        return { flash: flashCost, pro: proCost };
    }

    /**
     * Get usage recommendations for cost optimization
     */
    getCostOptimizationRecommendations(): string[] {
        const summary = this.getCostSummary();
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
    }

    /**
     * Clear old records to save storage
     */
    cleanupOldRecords(): void {
        try {
            const records = this.getAPICallRecords();
            const now = Date.now();
            const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

            const recentRecords = records.filter(record => record.timestamp > ninetyDaysAgo);
            
            if (recentRecords.length < records.length) {
                localStorage.setItem(this.COST_KEY, JSON.stringify(recentRecords));
                console.log(`🧹 Cleaned up ${records.length - recentRecords.length} old API call records`);
            }
        } catch (error) {
            console.error('Error cleaning up old records:', error);
        }
    }

    /**
     * Export cost data for analysis
     */
    exportCostData(): string {
        try {
            const records = this.getAPICallRecords();
            const csv = [
                'Timestamp,Model,Purpose,UserTier,Cost,Success',
                ...records.map(record => 
                    `${new Date(record.timestamp).toISOString()},${record.model},${record.purpose},${record.userTier},${record.cost},${record.success}`
                )
            ].join('\n');

            return csv;
        } catch (error) {
            console.error('Error exporting cost data:', error);
            return '';
        }
    }

    /**
     * Reset all cost tracking (for testing/debugging)
     */
    resetCostTracking(): void {
        try {
            localStorage.removeItem(this.COST_KEY);
            console.log('🔄 API cost tracking reset');
        } catch (error) {
            console.error('Error resetting cost tracking:', error);
        }
    }
}

export const apiCostService = APICostService.getInstance();
