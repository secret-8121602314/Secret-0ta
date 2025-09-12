/**
 * FEEDBACK SECURITY SERVICE
 * 
 * This service ensures that feedback only affects AI responses and insight content,
 * and NEVER modifies system settings, user preferences, or app behavior.
 * 
 * SECURITY PRINCIPLES:
 * 1. Feedback is READ-ONLY for system configuration
 * 2. Feedback can ONLY influence AI response generation
 * 3. Feedback can ONLY influence insight tab content
 * 4. NO system settings, preferences, or app behavior can be modified by feedback
 */

import { supabase } from './supabase';

// Define what feedback CAN affect (whitelist approach)
export const ALLOWED_FEEDBACK_INFLUENCES = {
  AI_RESPONSES: [
    'response_style',
    'response_length',
    'response_tone',
    'response_detail_level',
    'response_format',
    'response_personality',
    'response_accuracy',
    'response_relevance',
    'response_helpfulness',
    'response_clarity',
    'response_engagement',
    'response_personalization',
    'response_adaptation',
    'response_consistency',
    'response_quality',
    'response_effectiveness'
  ],
  INSIGHT_CONTENT: [
    'insight_accuracy',
    'insight_relevance',
    'insight_detail_level',
    'insight_format',
    'insight_timing',
    'insight_prioritization',
    'insight_helpfulness',
    'insight_clarity',
    'insight_engagement',
    'insight_personalization',
    'insight_quality',
    'insight_effectiveness'
  ],
  USER_EXPERIENCE: [
    'user_satisfaction',
    'user_engagement',
    'user_learning',
    'user_progress',
    'user_guidance',
    'user_support',
    'user_help',
    'user_assistance',
    'user_guidance_quality',
    'user_experience_improvement'
  ],
  GAMING_CONTENT: [
    'gaming_help',
    'gaming_guidance',
    'gaming_tips',
    'gaming_strategy',
    'gaming_advice',
    'gaming_support',
    'gaming_education',
    'gaming_learning',
    'gaming_progress',
    'gaming_improvement',
    'gaming_optimization',
    'gaming_enhancement'
  ]
} as const;

// Define what feedback CANNOT affect (blacklist approach)
export const FORBIDDEN_FEEDBACK_INFLUENCES = {
  SYSTEM_SETTINGS: [
    'app_configuration',
    'feature_flags',
    'system_permissions',
    'database_schema',
    'api_endpoints',
    'security_settings',
    'system_infrastructure',
    'server_configuration',
    'database_configuration',
    'network_settings'
  ],
  USER_PREFERENCES: [
    'user_preferences',
    'user_settings',
    'user_profile',
    'user_tier',
    'user_permissions',
    'user_authentication',
    'user_data',
    'user_account',
    'user_credentials',
    'user_identity'
  ],
  APP_BEHAVIOR: [
    'app_navigation',
    'app_ui_behavior',
    'app_functionality',
    'app_performance',
    'app_security',
    'app_analytics',
    'app_caching',
    'app_architecture',
    'app_infrastructure',
    'app_deployment'
  ],
  SYSTEM_STATE: [
    'system_state',
    'system_configuration',
    'system_performance',
    'system_security',
    'system_monitoring',
    'system_logging',
    'system_maintenance',
    'system_updates',
    'system_backup',
    'system_recovery'
  ],
  NON_GAMING_CONTENT: [
    'non_gaming',
    'off_topic',
    'personal_advice',
    'medical_advice',
    'financial_advice',
    'legal_advice',
    'political_content',
    'religious_content',
    'adult_content',
    'inappropriate_content'
  ]
} as const;

export interface FeedbackSecurityContext {
  feedbackType: 'message' | 'insight';
  targetId: string;
  conversationId: string;
  originalText: string;
  feedbackText: string;
  userId: string;
  timestamp: number;
}

export interface SecurityValidationResult {
  isValid: boolean;
  allowedInfluences: string[];
  forbiddenAttempts: string[];
  securityWarnings: string[];
  sanitizedFeedback: string;
}

class FeedbackSecurityService {
  private static instance: FeedbackSecurityService;
  private securityLog: Array<{
    timestamp: number;
    userId: string;
    action: string;
    result: 'allowed' | 'blocked' | 'sanitized';
    details: string;
  }> = [];

  static getInstance(): FeedbackSecurityService {
    if (!FeedbackSecurityService.instance) {
      FeedbackSecurityService.instance = new FeedbackSecurityService();
    }
    return FeedbackSecurityService.instance;
  }

  /**
   * Validate that feedback only affects allowed areas while maintaining gaming focus
   */
  validateFeedbackSecurity(context: FeedbackSecurityContext): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      allowedInfluences: [],
      forbiddenAttempts: [],
      securityWarnings: [],
      sanitizedFeedback: context.feedbackText
    };

    // Check for forbidden influence attempts
    const feedbackText = context.feedbackText.toLowerCase();
    
    // Check for system settings modification attempts
    FORBIDDEN_FEEDBACK_INFLUENCES.SYSTEM_SETTINGS.forEach(forbidden => {
      if (feedbackText.includes(forbidden.replace('_', ' '))) {
        result.forbiddenAttempts.push(`system_settings:${forbidden}`);
        result.securityWarnings.push(`Attempted to influence system setting: ${forbidden}`);
        result.isValid = false;
      }
    });

    // Check for user preferences modification attempts (but allow AI response style preferences)
    FORBIDDEN_FEEDBACK_INFLUENCES.USER_PREFERENCES.forEach(forbidden => {
      if (feedbackText.includes(forbidden.replace('_', ' '))) {
        // Allow AI response style preferences but block system-level preferences
        if (!this.isAIResponseStylePreference(feedbackText, forbidden)) {
          result.forbiddenAttempts.push(`user_preferences:${forbidden}`);
          result.securityWarnings.push(`Attempted to influence user preference: ${forbidden}`);
          result.isValid = false;
        }
      }
    });

    // Check for app behavior modification attempts
    FORBIDDEN_FEEDBACK_INFLUENCES.APP_BEHAVIOR.forEach(forbidden => {
      if (feedbackText.includes(forbidden.replace('_', ' '))) {
        result.forbiddenAttempts.push(`app_behavior:${forbidden}`);
        result.securityWarnings.push(`Attempted to influence app behavior: ${forbidden}`);
        result.isValid = false;
      }
    });

    // Check for system state modification attempts
    FORBIDDEN_FEEDBACK_INFLUENCES.SYSTEM_STATE.forEach(forbidden => {
      if (feedbackText.includes(forbidden.replace('_', ' '))) {
        result.forbiddenAttempts.push(`system_state:${forbidden}`);
        result.securityWarnings.push(`Attempted to influence system state: ${forbidden}`);
        result.isValid = false;
      }
    });

    // Check for non-gaming content attempts
    FORBIDDEN_FEEDBACK_INFLUENCES.NON_GAMING_CONTENT.forEach(forbidden => {
      if (feedbackText.includes(forbidden.replace('_', ' '))) {
        result.forbiddenAttempts.push(`non_gaming_content:${forbidden}`);
        result.securityWarnings.push(`Attempted to influence non-gaming content: ${forbidden}`);
        result.isValid = false;
      }
    });

    // Identify allowed influences
    ALLOWED_FEEDBACK_INFLUENCES.AI_RESPONSES.forEach(allowed => {
      if (feedbackText.includes(allowed.replace('_', ' '))) {
        result.allowedInfluences.push(`ai_response:${allowed}`);
      }
    });

    ALLOWED_FEEDBACK_INFLUENCES.INSIGHT_CONTENT.forEach(allowed => {
      if (feedbackText.includes(allowed.replace('_', ' '))) {
        result.allowedInfluences.push(`insight_content:${allowed}`);
      }
    });

    ALLOWED_FEEDBACK_INFLUENCES.USER_EXPERIENCE.forEach(allowed => {
      if (feedbackText.includes(allowed.replace('_', ' '))) {
        result.allowedInfluences.push(`user_experience:${allowed}`);
      }
    });

    ALLOWED_FEEDBACK_INFLUENCES.GAMING_CONTENT.forEach(allowed => {
      if (feedbackText.includes(allowed.replace('_', ' '))) {
        result.allowedInfluences.push(`gaming_content:${allowed}`);
      }
    });

    // Check if feedback maintains gaming focus
    if (!this.hasGamingFocus(feedbackText)) {
      result.securityWarnings.push('Feedback should focus on gaming help and content');
      // Don't block, but add warning
    }

    // Sanitize feedback text to remove forbidden content
    result.sanitizedFeedback = this.sanitizeFeedbackText(context.feedbackText);

    // Log security validation
    this.logSecurityEvent(context.userId, 'feedback_validation', 
      result.isValid ? 'allowed' : 'blocked', 
      JSON.stringify(result)
    );

    return result;
  }

  /**
   * Check if feedback is about AI response style preferences (allowed)
   */
  private isAIResponseStylePreference(feedbackText: string, forbidden: string): boolean {
    const aiResponseStyleKeywords = [
      'response style', 'response tone', 'response length', 'response format',
      'response personality', 'response detail', 'response clarity',
      'ai style', 'ai tone', 'ai personality', 'ai format',
      'make responses', 'change responses', 'improve responses',
      'response should be', 'responses should be', 'ai should be'
    ];

    // If it's about user preferences but in the context of AI response style, allow it
    if (forbidden === 'user_preferences' || forbidden === 'user_settings') {
      return aiResponseStyleKeywords.some(keyword => feedbackText.includes(keyword));
    }

    return false;
  }

  /**
   * Check if feedback maintains gaming focus
   */
  private hasGamingFocus(feedbackText: string): boolean {
    const gamingKeywords = [
      'game', 'gaming', 'player', 'quest', 'level', 'character', 'item',
      'boss', 'strategy', 'tip', 'help', 'guide', 'walkthrough', 'build',
      'skill', 'ability', 'weapon', 'armor', 'inventory', 'loot',
      'dungeon', 'raid', 'pvp', 'pve', 'mmo', 'rpg', 'fps', 'strategy',
      'adventure', 'puzzle', 'simulation', 'sports', 'action', 'platformer'
    ];

    // Check if feedback contains gaming-related terms
    return gamingKeywords.some(keyword => feedbackText.includes(keyword));
  }

  /**
   * Sanitize feedback text to remove any potentially harmful content
   */
  private sanitizeFeedbackText(feedbackText: string): string {
    let sanitized = feedbackText;

    // Remove any attempts to influence system settings
    FORBIDDEN_FEEDBACK_INFLUENCES.SYSTEM_SETTINGS.forEach(forbidden => {
      const regex = new RegExp(forbidden.replace('_', ' '), 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED]');
    });

    // Remove any attempts to influence user preferences (but preserve AI response style preferences)
    FORBIDDEN_FEEDBACK_INFLUENCES.USER_PREFERENCES.forEach(forbidden => {
      if (!this.isAIResponseStylePreference(feedbackText, forbidden)) {
        const regex = new RegExp(forbidden.replace('_', ' '), 'gi');
        sanitized = sanitized.replace(regex, '[REDACTED]');
      }
    });

    // Remove any attempts to influence app behavior
    FORBIDDEN_FEEDBACK_INFLUENCES.APP_BEHAVIOR.forEach(forbidden => {
      const regex = new RegExp(forbidden.replace('_', ' '), 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED]');
    });

    // Remove any attempts to influence system state
    FORBIDDEN_FEEDBACK_INFLUENCES.SYSTEM_STATE.forEach(forbidden => {
      const regex = new RegExp(forbidden.replace('_', ' '), 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED]');
    });

    // Remove any attempts to influence non-gaming content
    FORBIDDEN_FEEDBACK_INFLUENCES.NON_GAMING_CONTENT.forEach(forbidden => {
      const regex = new RegExp(forbidden.replace('_', ' '), 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED]');
    });

    return sanitized;
  }

  /**
   * Ensure feedback learning only affects AI responses and insights while allowing broader improvements
   */
  validateLearningScope(learningType: string, patternData: Record<string, any>): boolean {
    const allowedLearningTypes = [
      'response_pattern',
      'error_correction',
      'success_pattern',
      'user_preference', // For AI response personalization and user experience
      'insight_accuracy',
      'insight_relevance',
      'user_experience', // For overall user experience improvement
      'gaming_content', // For gaming-specific content improvement
      'response_quality',
      'response_effectiveness',
      'user_satisfaction',
      'user_engagement'
    ];

    if (!allowedLearningTypes.includes(learningType)) {
      this.logSecurityEvent('system', 'learning_scope_validation', 'blocked', 
        `Attempted to learn from feedback with type: ${learningType}`);
      return false;
    }

    // Additional validation for user_preference learning
    if (learningType === 'user_preference') {
      const allowedPreferenceFields = [
        'response_style',
        'response_length',
        'response_tone',
        'response_detail_level',
        'response_format',
        'response_personality',
        'response_helpfulness',
        'response_clarity',
        'response_engagement',
        'response_personalization',
        'response_adaptation',
        'response_consistency',
        'response_quality',
        'response_effectiveness',
        'user_satisfaction',
        'user_engagement',
        'user_learning',
        'user_progress',
        'user_guidance',
        'user_support',
        'user_help',
        'user_assistance'
      ];

      const hasForbiddenFields = Object.keys(patternData).some(key => 
        !allowedPreferenceFields.includes(key) && 
        !['feedback_type', 'success', 'timestamp', 'feedback_category', 'severity'].includes(key)
      );

      if (hasForbiddenFields) {
        this.logSecurityEvent('system', 'preference_learning_validation', 'blocked', 
          `Attempted to learn forbidden preference fields: ${JSON.stringify(patternData)}`);
        return false;
      }
    }

    // Validate gaming content focus for all learning types
    if (learningType === 'gaming_content' || learningType === 'user_experience') {
      const hasGamingContext = Object.values(patternData).some(value => 
        typeof value === 'string' && this.hasGamingFocus(value.toLowerCase())
      );

      if (!hasGamingContext) {
        this.logSecurityEvent('system', 'gaming_focus_validation', 'blocked', 
          `Learning type ${learningType} should maintain gaming focus`);
        // Don't block, but log warning
      }
    }

    return true;
  }

  /**
   * Ensure database operations from feedback are read-only for system data
   */
  validateDatabaseOperation(operation: string, table: string, data: any): boolean {
    const readOnlyTables = [
      'system_new',
      'progress_history',
      'ai_feedback',
      'user_feedback'
    ];

    const writeOnlyTables = [
      'users',
      'users',
      'user_preferences',
      'app_settings',
      'system_config'
    ];

    // Allow read operations on any table
    if (operation === 'select' || operation === 'read') {
      return true;
    }

    // Allow write operations only on feedback-related tables
    if (readOnlyTables.includes(table)) {
      // Additional validation for system_new table
      if (table === 'system_new' && data?.system_data) {
        const allowedCategories = [
          'progress_feedback',
          'ai_learning',
          'feedback_analysis'
        ];
        
        if (!allowedCategories.includes(data.system_data.category)) {
          this.logSecurityEvent('system', 'database_operation_validation', 'blocked', 
            `Attempted to write forbidden category to system_new: ${data.system_data.category}`);
          return false;
        }
      }
      return true;
    }

    // Block write operations on system configuration tables
    if (writeOnlyTables.includes(table)) {
      this.logSecurityEvent('system', 'database_operation_validation', 'blocked', 
        `Attempted to write to protected table: ${table}`);
      return false;
    }

    return true;
  }

  /**
   * Log security events for monitoring
   */
  private logSecurityEvent(userId: string, action: string, result: 'allowed' | 'blocked' | 'sanitized', details: string): void {
    const event = {
      timestamp: Date.now(),
      userId,
      action,
      result,
      details
    };

    this.securityLog.push(event);

    // Keep only last 1000 events
    if (this.securityLog.length > 1000) {
      this.securityLog = this.securityLog.slice(-1000);
    }

    // Log to console for development only
    if (result === 'blocked' && process.env.NODE_ENV === 'development') {
      console.warn('🚨 FEEDBACK SECURITY BLOCKED:', {
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get security log for monitoring
   */
  getSecurityLog(): Array<{
    timestamp: number;
    userId: string;
    action: string;
    result: 'allowed' | 'blocked' | 'sanitized';
    details: string;
  }> {
    return [...this.securityLog];
  }

  /**
   * Clear security log (for testing)
   */
  clearSecurityLog(): void {
    this.securityLog = [];
  }
}

export const feedbackSecurityService = FeedbackSecurityService.getInstance();
