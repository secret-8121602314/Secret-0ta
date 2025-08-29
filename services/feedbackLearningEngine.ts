import { aiContextService } from './aiContextService';
import { getRecentNegativeFeedback, categorizeFeedback, analyzeFeedbackSeverity } from './feedbackService';

export interface LearningPattern {
  patternType: 'success' | 'failure' | 'improvement';
  category: string;
  confidence: number;
  frequency: number;
  lastOccurrence: number;
  suggestedActions: string[];
}

export interface SystemImprovement {
  type: 'instruction_update' | 'response_strategy' | 'context_enhancement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation: string;
  expectedImpact: string;
}

export class FeedbackLearningEngine {
  private static instance: FeedbackLearningEngine;
  private learningCache: Map<string, LearningPattern> = new Map();
  private improvementQueue: SystemImprovement[] = [];

  static getInstance(): FeedbackLearningEngine {
    if (!FeedbackLearningEngine.instance) {
      FeedbackLearningEngine.instance = new FeedbackLearningEngine();
    }
    return FeedbackLearningEngine.instance;
  }

  /**
   * Analyze feedback patterns and generate learning insights
   */
  async analyzeFeedbackPatterns(timeframe: string = '30d'): Promise<LearningPattern[]> {
    try {
      // Get recent negative feedback
      const recentFeedback = getRecentNegativeFeedback(10);
      
      // Analyze patterns
      const patterns: LearningPattern[] = [];
      const categoryCounts: Record<string, number> = {};
      const severityCounts: Record<string, number> = {};

      recentFeedback.forEach(feedback => {
        const category = categorizeFeedback(feedback.feedbackText);
        const severity = analyzeFeedbackSeverity(feedback.feedbackText);
        
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      });

      // Generate patterns based on frequency and severity
      Object.entries(categoryCounts).forEach(([category, count]) => {
        const severity = this.getMostCommonSeverity(category, recentFeedback);
        const confidence = this.calculateConfidence(count, recentFeedback.length);
        
        patterns.push({
          patternType: severity === 'high' ? 'failure' : 'improvement',
          category,
          confidence,
          frequency: count,
          lastOccurrence: Date.now(),
          suggestedActions: this.generateSuggestedActions(category, severity)
        });
      });

      // Cache patterns for quick access
      patterns.forEach(pattern => {
        this.learningCache.set(pattern.category, pattern);
      });

      return patterns;
    } catch (error) {
      console.error('Error analyzing feedback patterns:', error);
      return [];
    }
  }

  /**
   * Generate system improvements based on feedback patterns
   */
  async generateSystemImprovements(patterns: LearningPattern[]): Promise<SystemImprovement[]> {
    const improvements: SystemImprovement[] = [];

    patterns.forEach(pattern => {
      if (pattern.patternType === 'failure' && pattern.confidence > 0.7) {
        improvements.push({
          type: 'instruction_update',
          priority: pattern.category === 'spoiler_alert' ? 'critical' : 'high',
          description: `Address ${pattern.category.replace('_', ' ')} issues`,
          implementation: this.generateImplementationStrategy(pattern),
          expectedImpact: `Reduce ${pattern.category} complaints by improving AI guidance`
        });
      }

      if (pattern.frequency > 3) {
        improvements.push({
          type: 'response_strategy',
          priority: 'medium',
          description: `Optimize response strategy for ${pattern.category}`,
          implementation: this.generateResponseStrategy(pattern),
          expectedImpact: `Improve user satisfaction for ${pattern.category} scenarios`
        });
      }
    });

    // Add to improvement queue
    this.improvementQueue.push(...improvements);
    
    return improvements;
  }

  /**
   * Get feedback-based improvements for AI system instructions
   */
  async getFeedbackBasedImprovements(conversationId: string): Promise<string> {
    try {
      const patterns = await this.analyzeFeedbackPatterns('7d');
      const improvements = await this.generateSystemImprovements(patterns);
      
      if (improvements.length === 0) return '';

      let improvementText = '\n\n**FEEDBACK-BASED IMPROVEMENTS:**\n';
      
      // Group by priority
      const critical = improvements.filter(i => i.priority === 'critical');
      const high = improvements.filter(i => i.priority === 'high');
      const medium = improvements.filter(i => i.priority === 'medium');

      if (critical.length > 0) {
        improvementText += '\n**CRITICAL IMPROVEMENTS:**\n';
        critical.forEach(imp => {
          improvementText += `- ${imp.description}: ${imp.implementation}\n`;
        });
      }

      if (high.length > 0) {
        improvementText += '\n**HIGH PRIORITY IMPROVEMENTS:**\n';
        high.forEach(imp => {
          improvementText += `- ${imp.description}: ${imp.implementation}\n`;
        });
      }

      if (medium.length > 0) {
        improvementText += '\n**MEDIUM PRIORITY IMPROVEMENTS:**\n';
        medium.forEach(imp => {
          improvementText += `- ${imp.description}: ${imp.implementation}\n`;
        });
      }

      return improvementText;
    } catch (error) {
      console.warn('Failed to get feedback-based improvements:', error);
      return '';
    }
  }

  /**
   * Get real-time feedback insights for a conversation
   */
  async getRealTimeFeedbackInsights(conversationId: string) {
    try {
      const recentFeedback = getRecentNegativeFeedback(5);
      const relevantFeedback = recentFeedback.filter(f => 
        f.conversationId === conversationId || 
        f.feedbackText.toLowerCase().includes('spoiler') ||
        f.feedbackText.toLowerCase().includes('unhelpful')
      );

      const insights = {
        hasRecentIssues: relevantFeedback.some(f => 
          analyzeFeedbackSeverity(f.feedbackText) === 'high'
        ),
        commonProblems: this.identifyCommonProblems(relevantFeedback),
        suggestedImprovements: this.generateSuggestedImprovements(relevantFeedback),
        confidenceLevel: this.calculateConfidenceLevel(relevantFeedback)
      };

      return insights;
    } catch (error) {
      console.warn('Failed to get real-time feedback insights:', error);
      return {
        hasRecentIssues: false,
        commonProblems: [],
        suggestedImprovements: [],
        confidenceLevel: 'high' as const
      };
    }
  }

  /**
   * Validate AI response based on recent feedback patterns
   */
  async validateResponseWithFeedback(response: string, conversationId: string): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      const feedbackInsights = await this.getRealTimeFeedbackInsights(conversationId);
      const issues: string[] = [];

      if (feedbackInsights.hasRecentIssues) {
        const commonProblems = feedbackInsights.commonProblems;

        if (commonProblems.includes('spoiler_alert')) {
          // Extra spoiler check
          const spoilerCheck = await this.checkSpoilerSafety(response, conversationId);
          if (!spoilerCheck.safe) {
            issues.push('Potential spoiler content detected');
          }
        }

        if (commonProblems.includes('unhelpful_response')) {
          // Check response actionability
          const actionabilityScore = this.calculateActionabilityScore(response);
          if (actionabilityScore < 0.6) {
            issues.push('Response may not be actionable enough');
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.warn('Failed to validate response with feedback:', error);
      return { isValid: true, issues: [] };
    }
  }

  // Private helper methods
  private getMostCommonSeverity(category: string, feedback: any[]): string {
    const categoryFeedback = feedback.filter(f => categorizeFeedback(f.feedbackText) === category);
    const severityCounts: Record<string, number> = {};
    
    categoryFeedback.forEach(f => {
      const severity = analyzeFeedbackSeverity(f.feedbackText);
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    return Object.entries(severityCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'medium';
  }

  private calculateConfidence(count: number, total: number): number {
    return Math.min(count / total * 2, 1); // Scale confidence based on frequency
  }

  private generateSuggestedActions(category: string, severity: string): string[] {
    const actions: Record<string, string[]> = {
      spoiler_alert: ['Enhance spoiler detection', 'Add progress-based filtering', 'Improve context awareness'],
      factual_error: ['Verify information sources', 'Add fact-checking', 'Improve search accuracy'],
      unhelpful_response: ['Focus on actionable guidance', 'Provide specific examples', 'Improve response structure'],
      formatting_issue: ['Standardize response format', 'Improve markdown usage', 'Add visual structure'],
      response_length: ['Optimize response length', 'Add detail controls', 'Improve conciseness']
    };

    return actions[category] || ['Review response quality', 'Improve user guidance'];
  }

  private generateImplementationStrategy(pattern: LearningPattern): string {
    const strategies: Record<string, string> = {
      spoiler_alert: 'Add extra spoiler detection layers and progress-based content filtering',
      factual_error: 'Implement fact verification and improve search result validation',
      unhelpful_response: 'Focus on providing specific, actionable guidance with examples',
      formatting_issue: 'Standardize response formatting and improve visual structure',
      response_length: 'Optimize response length based on user preferences and query complexity'
    };

    return strategies[pattern.category] || 'Review and improve response quality';
  }

  private generateResponseStrategy(pattern: LearningPattern): string {
    const strategies: Record<string, string> = {
      spoiler_alert: 'Use more conservative content filtering and progress validation',
      factual_error: 'Implement multi-source verification and confidence scoring',
      unhelpful_response: 'Provide structured, step-by-step guidance with clear actions',
      formatting_issue: 'Use consistent formatting templates and visual hierarchy',
      response_length: 'Adapt response length based on query complexity and user history'
    };

    return strategies[pattern.category] || 'Optimize response approach based on user needs';
  }

  private identifyCommonProblems(feedback: any[]): string[] {
    const problems: Record<string, number> = {};
    
    feedback.forEach(f => {
      const category = categorizeFeedback(f.feedbackText);
      problems[category] = (problems[category] || 0) + 1;
    });

    return Object.entries(problems)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([problem]) => problem);
  }

  private generateSuggestedImprovements(feedback: any[]): string[] {
    const problems = this.identifyCommonProblems(feedback);
    const improvements: string[] = [];

    problems.forEach(problem => {
      switch (problem) {
        case 'spoiler_alert':
          improvements.push('Be extra careful about revealing future content');
          break;
        case 'unhelpful_response':
          improvements.push('Focus on providing actionable, specific guidance');
          break;
        case 'factual_error':
          improvements.push('Double-check all information before providing it');
          break;
        default:
          improvements.push('Review response quality and user satisfaction');
      }
    });

    return improvements;
  }

  private calculateConfidenceLevel(feedback: any[]): 'high' | 'medium' | 'low' {
    if (feedback.length === 0) return 'high';
    
    const negativeCount = feedback.filter(f => 
      analyzeFeedbackSeverity(f.feedbackText) === 'high' ||
      analyzeFeedbackSeverity(f.feedbackText) === 'medium'
    ).length;
    
    const negativeRatio = negativeCount / feedback.length;
    
    if (negativeRatio > 0.5) return 'low';
    if (negativeRatio > 0.2) return 'medium';
    return 'high';
  }

  private async checkSpoilerSafety(response: string, conversationId: string): Promise<{ safe: boolean; issues: string[] }> {
    // Basic spoiler detection - can be enhanced with more sophisticated logic
    const spoilerKeywords = ['ending', 'final boss', 'last level', 'secret ending', 'true ending'];
    const issues: string[] = [];
    
    spoilerKeywords.forEach(keyword => {
      if (response.toLowerCase().includes(keyword.toLowerCase())) {
        issues.push(`Contains potential spoiler keyword: ${keyword}`);
      }
    });

    return {
      safe: issues.length === 0,
      issues
    };
  }

  private calculateActionabilityScore(response: string): number {
    const actionWords = ['try', 'check', 'look for', 'examine', 'investigate', 'use', 'apply', 'follow'];
    const actionCount = actionWords.filter(word => 
      response.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    // Normalize score between 0 and 1
    return Math.min(actionCount / 3, 1);
  }
}

export const feedbackLearningEngine = FeedbackLearningEngine.getInstance();
