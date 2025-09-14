import { getRecentNegativeFeedback, categorizeFeedback, analyzeFeedbackSeverity } from './feedbackService';
import { feedbackLearningEngine } from './feedbackLearningEngine';

export interface FeedbackTrends {
  totalFeedback: number;
  negativeFeedback: number;
  positiveRate: number;
  commonIssues: Array<{ issue: string; count: number }>;
  improvementAreas: string[];
  successRate: number;
}

export interface DailyFeedbackTrend {
  date: string;
  total: number;
  negative: number;
  positive: number;
}

export interface FeedbackInsights {
  topIssues: Array<{ issue: string; count: number; severity: string }>;
  userSatisfaction: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  recentImprovements: string[];
}

export class FeedbackAnalyticsService {
  private static instance: FeedbackAnalyticsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FeedbackAnalyticsService {
    if (!FeedbackAnalyticsService.instance) {
      FeedbackAnalyticsService.instance = new FeedbackAnalyticsService();
    }
    return FeedbackAnalyticsService.instance;
  }

  /**
   * Generate comprehensive feedback report
   */
  async generateFeedbackReport(timeframe: string = '30d'): Promise<{
    summary: FeedbackTrends;
    trends: {
      daily: DailyFeedbackTrend[];
      weekly: DailyFeedbackTrend[];
      monthly: DailyFeedbackTrend[];
    };
    insights: FeedbackInsights;
    recommendations: string[];
  }> {
    try {
      const cacheKey = `feedback_report_${timeframe}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const trends = await this.analyzeFeedbackTrends(timeframe);
      const allFeedback = this.getAllFeedbackData();
      
      const report = {
        summary: {
          totalFeedback: allFeedback.length,
          negativeFeedback: trends.negativeFeedback,
          positiveRate: Number(((allFeedback.length - trends.negativeFeedback) / allFeedback.length * 100).toFixed(1)),                                                                                                 
          commonIssues: trends.commonIssues,
          improvementAreas: trends.improvementAreas,
          successRate: trends.successRate
        },
        trends: {
          daily: await this.getDailyFeedbackTrends(timeframe),
          weekly: await this.getWeeklyFeedbackTrends(timeframe),
          monthly: await this.getMonthlyFeedbackTrends(timeframe)
        },
        insights: await this.generateInsights(trends),
        recommendations: await this.generateRecommendations(trends)
      };

      this.cacheData(cacheKey, report);
      return report;
    } catch (error) {
      console.error('Error generating feedback report:', error);
      return this.getDefaultReport();
    }
  }

  /**
   * Analyze feedback trends over time
   */
  async analyzeFeedbackTrends(timeframe: string = '30d'): Promise<FeedbackTrends> {
    try {
      const allFeedback = this.getAllFeedbackData();
      const timeframeMs = this.getTimeframeMs(timeframe);
      const recentFeedback = allFeedback.filter(f => Date.now() - f.timestamp < timeframeMs);
      
      const trends: FeedbackTrends = {
        totalFeedback: recentFeedback.length,
        negativeFeedback: recentFeedback.filter(f => 
          f.feedbackText.toLowerCase().includes('not helpful') || 
          f.feedbackText.toLowerCase().includes('wrong') ||
          f.feedbackText.toLowerCase().includes('spoiler') ||
          f.feedbackText.toLowerCase().includes('unhelpful')
        ).length,
        positiveRate: 0,
        commonIssues: [],
        improvementAreas: [],
        successRate: 0
      };

      // Calculate positive rate
      trends.positiveRate = ((trends.totalFeedback - trends.negativeFeedback) / trends.totalFeedback * 100);
      
      // Identify common issues
      trends.commonIssues = this.identifyCommonIssues(recentFeedback);
      
      // Identify improvement areas
      trends.improvementAreas = this.identifyImprovementAreas(recentFeedback);
      
      // Calculate success rate
      trends.successRate = this.calculateSuccessRate(recentFeedback);

      return trends;
    } catch (error) {
      console.error('Error analyzing feedback trends:', error);
      return this.getDefaultTrends();
    }
  }

  /**
   * Get daily feedback trends
   */
  async getDailyFeedbackTrends(timeframe: string = '30d'): Promise<DailyFeedbackTrend[]> {
    try {
      const allFeedback = this.getAllFeedbackData();
      const timeframeMs = this.getTimeframeMs(timeframe);
      const recentFeedback = allFeedback.filter(f => Date.now() - f.timestamp < timeframeMs);
      
      const dailyData: Record<string, { total: number; negative: number; positive: number }> = {};
      
      recentFeedback.forEach(feedback => {
        const date = new Date(feedback.timestamp).toDateString();
        if (!dailyData[date]) {
          dailyData[date] = { total: 0, negative: 0, positive: 0 };
        }
        
        dailyData[date].total++;
        
        if (this.isNegativeFeedback(feedback.feedbackText)) {
          dailyData[date].negative++;
        } else {
          dailyData[date].positive++;
        }
      });

      return Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          ...data
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error getting daily feedback trends:', error);
      return [];
    }
  }

  /**
   * Get weekly feedback trends
   */
  async getWeeklyFeedbackTrends(timeframe: string = '30d'): Promise<DailyFeedbackTrend[]> {
    try {
      const dailyTrends = await this.getDailyFeedbackTrends(timeframe);
      const weeklyData: Record<string, { total: number; negative: number; positive: number }> = {};
      
      dailyTrends.forEach(day => {
        const weekStart = this.getWeekStart(new Date(day.date));
        const weekKey = weekStart.toDateString();
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { total: 0, negative: 0, positive: 0 };
        }
        
        weeklyData[weekKey].total += day.total;
        weeklyData[weekKey].negative += day.negative;
        weeklyData[weekKey].positive += day.positive;
      });

      return Object.entries(weeklyData)
        .map(([date, data]) => ({
          date,
          ...data
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error getting weekly feedback trends:', error);
      return [];
    }
  }

  /**
   * Get monthly feedback trends
   */
  async getMonthlyFeedbackTrends(timeframe: string = '30d'): Promise<DailyFeedbackTrend[]> {
    try {
      const dailyTrends = await this.getDailyFeedbackTrends(timeframe);
      const monthlyData: Record<string, { total: number; negative: number; positive: number }> = {};
      
      dailyTrends.forEach(day => {
        const monthStart = new Date(day.date);
        monthStart.setDate(1);
        const monthKey = monthStart.toDateString();
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, negative: 0, positive: 0 };
        }
        
        monthlyData[monthKey].total += day.total;
        monthlyData[monthKey].negative += day.negative;
        monthlyData[monthKey].positive += day.positive;
      });

      return Object.entries(monthlyData)
        .map(([date, data]) => ({
          date,
          ...data
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error getting monthly feedback trends:', error);
      return [];
    }
  }

  /**
   * Generate insights from feedback data
   */
  async generateInsights(trends: FeedbackTrends): Promise<FeedbackInsights> {
    try {
      const allFeedback = this.getAllFeedbackData();
      const recentFeedback = allFeedback.slice(-20); // Last 20 feedback items
      
      const insights: FeedbackInsights = {
        topIssues: this.getTopIssues(recentFeedback),
        userSatisfaction: this.calculateUserSatisfaction(trends),
        systemHealth: this.calculateSystemHealth(trends),
        recommendations: this.generateInsightRecommendations(trends),
        recentImprovements: this.getRecentImprovements(recentFeedback)
      };

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(trends: FeedbackTrends): Promise<string[]> {
    const recommendations: string[] = [];
    
    // High priority recommendations
    if (trends.positiveRate < 70) {
      recommendations.push('Investigate root causes of negative feedback to improve user satisfaction');
    }
    
    if (trends.commonIssues.some(issue => issue.issue === 'spoiler_alert')) {
      recommendations.push('Enhance spoiler detection and prevention mechanisms');
    }
    
    if (trends.commonIssues.some(issue => issue.issue === 'unhelpful_response')) {
      recommendations.push('Improve response quality and actionability');
    }
    
    // Medium priority recommendations
    if (trends.successRate < 0.8) {
      recommendations.push('Review and optimize AI response strategies');
    }
    
    if (trends.improvementAreas.length > 0) {
      recommendations.push(`Focus on improving: ${trends.improvementAreas.join(', ')}`);
    }
    
    // General recommendations
    recommendations.push('Implement A/B testing for different response strategies');
    recommendations.push('Add more detailed feedback collection for better insights');
    recommendations.push('Create automated quality monitoring and alerting');
    
    return recommendations;
  }

  // Private helper methods
  private getAllFeedbackData(): any[] {
    try {
      const rawData = localStorage.getItem('otakonFeedbackData');
      return rawData ? JSON.parse(rawData) : [];
    } catch (error) {
      console.error('Failed to get feedback data:', error);
      return [];
    }
  }

  private getTimeframeMs(timeframe: string): number {
    const multipliers: Record<string, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    return multipliers[timeframe] || 30 * 24 * 60 * 60 * 1000;
  }

  private identifyCommonIssues(feedback: any[]): Array<{ issue: string; count: number }> {
    const issueCounts: Record<string, number> = {};
    
    feedback.forEach(f => {
      const category = categorizeFeedback(f.feedbackText);
      issueCounts[category] = (issueCounts[category] || 0) + 1;
    });

    return Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  private identifyImprovementAreas(feedback: any[]): string[] {
    const issues = this.identifyCommonIssues(feedback);
    return issues
      .filter(issue => issue.count > 1)
      .map(issue => issue.issue.replace('_', ' '));
  }

  private calculateSuccessRate(feedback: any[]): number {
    if (feedback.length === 0) return 1;
    
    const negativeCount = feedback.filter(f => this.isNegativeFeedback(f.feedbackText)).length;
    return (feedback.length - negativeCount) / feedback.length;
  }

  private isNegativeFeedback(feedbackText: string): boolean {
    const text = feedbackText.toLowerCase();
    return text.includes('not helpful') || 
           text.includes('wrong') || 
           text.includes('spoiler') || 
           text.includes('unhelpful') ||
           text.includes('incorrect');
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private getTopIssues(feedback: any[]): Array<{ issue: string; count: number; severity: string }> {
    const issueCounts: Record<string, { count: number; severities: string[] }> = {};
    
    feedback.forEach(f => {
      const category = categorizeFeedback(f.feedbackText);
      const severity = analyzeFeedbackSeverity(f.feedbackText);
      
      if (!issueCounts[category]) {
        issueCounts[category] = { count: 0, severities: [] };
      }
      
      issueCounts[category].count++;
      issueCounts[category].severities.push(severity);
    });

    return Object.entries(issueCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        severity: this.getMostCommonSeverity(data.severities)
      }));
  }

  private getMostCommonSeverity(severities: string[]): string {
    const counts: Record<string, number> = {};
    severities.forEach(s => counts[s] = (counts[s] || 0) + 1);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'medium';
  }

  private calculateUserSatisfaction(trends: FeedbackTrends): number {
    return Math.round(trends.positiveRate);
  }

  private calculateSystemHealth(trends: FeedbackTrends): 'excellent' | 'good' | 'fair' | 'poor' {
    if (trends.positiveRate >= 90) return 'excellent';
    if (trends.positiveRate >= 80) return 'good';
    if (trends.positiveRate >= 70) return 'fair';
    return 'poor';
  }

  private generateInsightRecommendations(trends: FeedbackTrends): string[] {
    const recommendations: string[] = [];
    
    if (trends.positiveRate < 80) {
      recommendations.push('Focus on improving response quality and user satisfaction');
    }
    
    if (trends.commonIssues.some(issue => issue.issue === 'spoiler_alert')) {
      recommendations.push('Enhance spoiler detection and prevention');
    }
    
    if (trends.commonIssues.some(issue => issue.issue === 'unhelpful_response')) {
      recommendations.push('Improve response actionability and usefulness');
    }
    
    return recommendations;
  }

  private getRecentImprovements(feedback: any[]): string[] {
    // This would track improvements over time
    // For now, return a placeholder
    return ['Enhanced spoiler detection', 'Improved response quality'];
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private cacheData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getDefaultReport() {
    return {
      summary: this.getDefaultTrends(),
      trends: { daily: [], weekly: [], monthly: [] },
      insights: this.getDefaultInsights(),
      recommendations: ['Start collecting feedback to generate insights']
    };
  }

  private getDefaultTrends(): FeedbackTrends {
    return {
      totalFeedback: 0,
      negativeFeedback: 0,
      positiveRate: 100,
      commonIssues: [],
      improvementAreas: [],
      successRate: 1
    };
  }

  private getDefaultInsights(): FeedbackInsights {
    return {
      topIssues: [],
      userSatisfaction: 100,
      systemHealth: 'excellent',
      recommendations: ['Begin feedback collection to generate insights'],
      recentImprovements: []
    };
  }
}

export const feedbackAnalyticsService = FeedbackAnalyticsService.getInstance();
