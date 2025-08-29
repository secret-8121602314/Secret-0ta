

import { supabase } from './supabase';
import { aiContextService } from './aiContextService';

const FEEDBACK_STORAGE_KEY = 'otakonFeedbackData';

export type Feedback = {
  id: string;
  conversationId: string;
  targetId: string; // messageId or insightId
  originalText: string;
  feedbackText: string;
  timestamp: number;
};

const getFeedbackData = (): Feedback[] => {
  try {
    const rawData = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error("Failed to parse feedback data from localStorage", error);
    return [];
  }
};

const saveFeedbackData = (data: Feedback[]) => {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save feedback data to localStorage", error);
  }
};

export const addFeedback = async (feedback: Omit<Feedback, 'id' | 'timestamp'>) => {
  // Store in localStorage for backward compatibility
  const allFeedback = getFeedbackData();
  const newFeedback: Feedback = {
    ...feedback,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  allFeedback.push(newFeedback);
  saveFeedbackData(allFeedback);

  // Store in Supabase for AI learning
  try {
    await aiContextService.storeAIFeedback({
      user_id: '', // Will be set by aiContextService
      conversation_id: feedback.conversationId,
      message_id: feedback.targetId,
      feedback_type: 'submitted',
      feedback_text: feedback.feedbackText,
      ai_response_context: {
        original_text: feedback.originalText,
        feedback_text: feedback.feedbackText,
        timestamp: Date.now(),
        feedback_category: categorizeFeedback(feedback.feedbackText),
        severity: analyzeFeedbackSeverity(feedback.feedbackText)
      },
      user_context: {
        feedback_type: 'submitted',
        conversation_id: feedback.conversationId,
        feedback_timestamp: Date.now()
      }
    });
  } catch (error) {
    console.warn('Failed to store feedback in Supabase for AI learning:', error);
  }
};

// Enhanced feedback analysis for AI learning
export const categorizeFeedback = (feedbackText: string): string => {
  const text = feedbackText.toLowerCase();
  
  if (text.includes('spoiler') || text.includes('ruined') || text.includes('reveal')) {
    return 'spoiler_alert';
  }
  if (text.includes('incorrect') || text.includes('wrong') || text.includes('false')) {
    return 'factual_error';
  }
  if (text.includes('unhelpful') || text.includes('useless') || text.includes('not helpful')) {
    return 'unhelpful_response';
  }
  if (text.includes('format') || text.includes('structure') || text.includes('layout')) {
    return 'formatting_issue';
  }
  if (text.includes('too long') || text.includes('verbose') || text.includes('wordy')) {
    return 'response_length';
  }
  if (text.includes('too short') || text.includes('brief') || text.includes('not detailed')) {
    return 'response_length';
  }
  
  return 'general_feedback';
};

export const analyzeFeedbackSeverity = (feedbackText: string): 'low' | 'medium' | 'high' => {
  const text = feedbackText.toLowerCase();
  
  // High severity indicators
  if (text.includes('spoiler') || text.includes('ruined') || text.includes('incorrect')) {
    return 'high';
  }
  
  // Medium severity indicators
  if (text.includes('unhelpful') || text.includes('wrong') || text.includes('bad')) {
    return 'medium';
  }
  
  // Low severity indicators
  if (text.includes('format') || text.includes('could be better') || text.includes('suggestion')) {
    return 'low';
  }
  
  return 'medium';
};

export const getRecentNegativeFeedback = (limit: number = 3): Feedback[] => {
  const allFeedback = getFeedbackData();
  // Sort by most recent first, then take the top 'limit'
  return allFeedback.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
};
