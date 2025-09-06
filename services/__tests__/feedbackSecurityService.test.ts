/**
 * FEEDBACK SECURITY SERVICE TESTS
 * 
 * These tests verify that the feedback security service properly prevents
 * feedback from affecting system settings, user preferences, or app behavior.
 */

import { feedbackSecurityService } from '../feedbackSecurityService';

describe('FeedbackSecurityService', () => {
  beforeEach(() => {
    // Clear security log before each test
    feedbackSecurityService.clearSecurityLog();
  });

  describe('validateFeedbackSecurity', () => {
    it('should allow feedback that affects AI responses and user experience', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'The AI response was helpful for my game progress',
        feedbackText: 'The response style was too verbose, please make it more concise and helpful for gaming',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(true);
      expect(result.forbiddenAttempts).toHaveLength(0);
      expect(result.allowedInfluences).toContain('ai_response:response_style');
      expect(result.sanitizedFeedback).toBe(context.feedbackText);
    });

    it('should allow feedback that affects insight content and gaming guidance', () => {
      const context = {
        feedbackType: 'insight' as const,
        targetId: 'insight_123',
        conversationId: 'conv_456',
        originalText: 'Insight content about the game strategy',
        feedbackText: 'The insight accuracy was good but the detail level could be higher for better gaming guidance',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(true);
      expect(result.forbiddenAttempts).toHaveLength(0);
      expect(result.allowedInfluences).toContain('insight_content:insight_accuracy');
      expect(result.allowedInfluences).toContain('gaming_content:gaming_guidance');
    });

    it('should block feedback attempting to modify system settings', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response',
        feedbackText: 'Please change the app configuration to enable dark mode and modify the system permissions',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(false);
      expect(result.forbiddenAttempts).toContain('system_settings:app_configuration');
      expect(result.forbiddenAttempts).toContain('system_settings:system_permissions');
      expect(result.securityWarnings.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow AI response style preferences but block system-level user preferences', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response about gaming',
        feedbackText: 'Please change my response style to be more concise and update my user tier to premium',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(false);
      expect(result.forbiddenAttempts).toContain('user_preferences:user_tier');
      expect(result.allowedInfluences).toContain('ai_response:response_style');
    });

    it('should allow AI response style preferences for gaming help', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response about gaming strategy',
        feedbackText: 'Please change the response style to be more helpful for gaming and make responses more engaging',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(true);
      expect(result.forbiddenAttempts).toHaveLength(0);
      expect(result.allowedInfluences).toContain('ai_response:response_style');
    });

    it('should block feedback attempting to modify app behavior', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response',
        feedbackText: 'Please change the app navigation and modify the app functionality',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(false);
      expect(result.forbiddenAttempts).toContain('app_behavior:app_navigation');
      expect(result.forbiddenAttempts).toContain('app_behavior:app_functionality');
    });

    it('should block feedback attempting to modify system state', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response',
        feedbackText: 'Please change the system configuration and modify the system security',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(false);
      expect(result.forbiddenAttempts).toContain('system_state:system_configuration');
      expect(result.forbiddenAttempts).toContain('system_state:system_security');
    });

    it('should block feedback attempting to influence non-gaming content', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response',
        feedbackText: 'Please provide medical advice and financial guidance instead of gaming help',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(false);
      expect(result.forbiddenAttempts).toContain('non_gaming_content:medical_advice');
    });

    it('should sanitize feedback text containing forbidden content', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response',
        feedbackText: 'The response was good but please change the app configuration and user preferences',
        userId: 'user_789',
        timestamp: Date.now()
      };

      const result = feedbackSecurityService.validateFeedbackSecurity(context);

      expect(result.isValid).toBe(false);
      expect(result.sanitizedFeedback).toContain('[REDACTED]');
      expect(result.sanitizedFeedback).not.toContain('app configuration');
      expect(result.sanitizedFeedback).not.toContain('user preferences');
    });
  });

  describe('validateLearningScope', () => {
    it('should allow valid learning types', () => {
      const validTypes = [
        'response_pattern',
        'error_correction',
        'success_pattern',
        'user_preference',
        'insight_accuracy',
        'insight_relevance',
        'user_experience',
        'gaming_content',
        'response_quality',
        'response_effectiveness',
        'user_satisfaction',
        'user_engagement'
      ];

      validTypes.forEach(type => {
        const result = feedbackSecurityService.validateLearningScope(type, { 
          feedback_type: 'up',
          success: true,
          timestamp: Date.now()
        });
        expect(result).toBe(true);
      });
    });

    it('should block invalid learning types', () => {
      const invalidTypes = [
        'system_configuration',
        'user_settings',
        'app_behavior',
        'database_schema',
        'security_settings'
      ];

      invalidTypes.forEach(type => {
        const result = feedbackSecurityService.validateLearningScope(type, { test: 'data' });
        expect(result).toBe(false);
      });
    });

    it('should allow broader user_preference learning for AI responses and user experience', () => {
      const allowedPattern = {
        response_style: 'concise',
        response_length: 'medium',
        response_tone: 'helpful',
        response_helpfulness: 'high',
        response_clarity: 'high',
        response_engagement: 'medium',
        user_satisfaction: 'high',
        user_engagement: 'medium',
        user_learning: 'high',
        user_guidance: 'high',
        user_support: 'high',
        feedback_type: 'up',
        success: true,
        timestamp: Date.now()
      };

      const forbiddenPattern = {
        user_tier: 'premium',
        user_settings: 'dark_mode',
        app_configuration: 'notifications',
        system_permissions: 'admin',
        feedback_type: 'up',
        success: true,
        timestamp: Date.now()
      };

      expect(feedbackSecurityService.validateLearningScope('user_preference', allowedPattern)).toBe(true);
      expect(feedbackSecurityService.validateLearningScope('user_preference', forbiddenPattern)).toBe(false);
    });
  });

  describe('validateDatabaseOperation', () => {
    it('should allow read operations on any table', () => {
      const tables = ['users', 'system_new', 'progress_history', 'ai_feedback'];
      
      tables.forEach(table => {
        expect(feedbackSecurityService.validateDatabaseOperation('select', table, {})).toBe(true);
        expect(feedbackSecurityService.validateDatabaseOperation('read', table, {})).toBe(true);
      });
    });

    it('should allow write operations on feedback-related tables', () => {
      const feedbackTables = ['system_new', 'progress_history', 'ai_feedback', 'user_feedback'];
      
      feedbackTables.forEach(table => {
        expect(feedbackSecurityService.validateDatabaseOperation('insert', table, { test: 'data' })).toBe(true);
        expect(feedbackSecurityService.validateDatabaseOperation('update', table, { test: 'data' })).toBe(true);
      });
    });

    it('should block write operations on system configuration tables', () => {
      const systemTables = ['users', 'users_new', 'user_preferences', 'app_settings', 'system_config'];
      
      systemTables.forEach(table => {
        expect(feedbackSecurityService.validateDatabaseOperation('insert', table, { test: 'data' })).toBe(false);
        expect(feedbackSecurityService.validateDatabaseOperation('update', table, { test: 'data' })).toBe(false);
      });
    });

    it('should validate system_new table category restrictions', () => {
      const allowedData = {
        system_data: {
          category: 'progress_feedback',
          event_type: 'confirmed'
        }
      };

      const forbiddenData = {
        system_data: {
          category: 'system_configuration',
          event_type: 'update'
        }
      };

      expect(feedbackSecurityService.validateDatabaseOperation('insert', 'system_new', allowedData)).toBe(true);
      expect(feedbackSecurityService.validateDatabaseOperation('insert', 'system_new', forbiddenData)).toBe(false);
    });
  });

  describe('security logging', () => {
    it('should log security events', () => {
      const context = {
        feedbackType: 'message' as const,
        targetId: 'msg_123',
        conversationId: 'conv_456',
        originalText: 'AI response',
        feedbackText: 'Please change the app configuration',
        userId: 'user_789',
        timestamp: Date.now()
      };

      feedbackSecurityService.validateFeedbackSecurity(context);
      
      const log = feedbackSecurityService.getSecurityLog();
      expect(log).toHaveLength(1);
      expect(log[0].result).toBe('blocked');
      expect(log[0].action).toBe('feedback_validation');
    });

    it('should maintain security log size limit', () => {
      // Generate more than 1000 events
      for (let i = 0; i < 1100; i++) {
        const context = {
          feedbackType: 'message' as const,
          targetId: `msg_${i}`,
          conversationId: 'conv_456',
          originalText: 'AI response',
          feedbackText: 'Please change the app configuration',
          userId: 'user_789',
          timestamp: Date.now()
        };
        feedbackSecurityService.validateFeedbackSecurity(context);
      }

      const log = feedbackSecurityService.getSecurityLog();
      expect(log).toHaveLength(1000);
    });
  });
});
