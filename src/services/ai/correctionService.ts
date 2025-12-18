/**
 * AI Correction Service
 * 
 * Handles validation and management of user corrections to AI behavior.
 * Uses AI to validate corrections before they're applied, ensuring:
 * - Corrections don't break OTAKON character
 * - Corrections are factually reasonable
 * - Corrections aren't harmful/inappropriate
 * - Corrections are contextually relevant
 */

import { supabase } from '../../lib/supabase';
import { behaviorService, type AICorrection, type CorrectionType, type CorrectionScope } from './behaviorService';

// ============================================================================
// Types
// ============================================================================

export interface CorrectionValidationResult {
  isValid: boolean;
  reason: string;
  suggestedType?: CorrectionType;
}

export interface CorrectionSubmission {
  originalResponse: string;
  correctionText: string;
  type: CorrectionType;
  scope: CorrectionScope;
  gameTitle: string | null;
  messageId: string;
  conversationId: string;
}

// ============================================================================
// Validation Prompts
// ============================================================================

const VALIDATION_SYSTEM_PROMPT = `You are a correction validator for OTAKON, an AI gaming companion.
Your job is to validate user-submitted corrections to ensure they:

1. DON'T BREAK CHARACTER: OTAKON is enthusiastic, knowledgeable, and uses gamer lingo. Corrections should maintain this personality.
2. ARE FACTUALLY REASONABLE: For gaming facts, the correction should be plausible (you don't need to verify, just check it's not obviously wrong).
3. ARE NOT HARMFUL: No offensive, discriminatory, or inappropriate content.
4. ARE CONTEXTUALLY RELEVANT: The correction should make sense in a gaming context.
5. ARE CONSTRUCTIVE: The correction should improve future responses.

Respond in JSON format:
{
  "isValid": boolean,
  "reason": "Brief explanation of your decision",
  "suggestedType": "factual" | "style" | "terminology" | "behavior" | null
}`;

const buildValidationUserPrompt = (original: string, correction: string, gameTitle: string | null) => `
Validate this correction:

ORIGINAL AI RESPONSE (snippet):
"${original.slice(0, 500)}"

USER'S CORRECTION:
"${correction}"

GAME CONTEXT: ${gameTitle || 'General gaming / Game Hub'}

Is this correction valid? Respond with JSON only.`;

// ============================================================================
// Rate Limiting
// ============================================================================

const RATE_LIMIT_KEY = 'otakon_correction_submissions';
const MAX_CORRECTIONS_PER_DAY = 3;

function checkRateLimit(): { allowed: boolean; remaining: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    
    if (!stored) {
      return { allowed: true, remaining: MAX_CORRECTIONS_PER_DAY };
    }
    
    const data = JSON.parse(stored) as { count: number; resetAt: number };
    
    // Reset if past reset time
    if (now > data.resetAt) {
      return { allowed: true, remaining: MAX_CORRECTIONS_PER_DAY };
    }
    
    const remaining = MAX_CORRECTIONS_PER_DAY - data.count;
    return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
  } catch {
    return { allowed: true, remaining: MAX_CORRECTIONS_PER_DAY };
  }
}

function incrementRateLimit(): void {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    let data = { count: 0, resetAt: now + dayMs };
    
    if (stored) {
      data = JSON.parse(stored);
      if (now > data.resetAt) {
        // Reset
        data = { count: 0, resetAt: now + dayMs };
      }
    }
    
    data.count++;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a correction using AI
 */
export async function validateCorrection(
  originalResponse: string,
  correctionText: string,
  gameTitle: string | null
): Promise<CorrectionValidationResult> {
  // Basic validation first
  if (!correctionText.trim()) {
    return { isValid: false, reason: 'Correction text is empty' };
  }
  
  if (correctionText.length < 5) {
    return { isValid: false, reason: 'Correction is too short' };
  }
  
  if (correctionText.length > 1000) {
    return { isValid: false, reason: 'Correction is too long (max 1000 characters)' };
  }
  
  // Content filtering (basic)
  const harmfulPatterns = [
    /\b(hate|kill|die|attack)\s+(all|every|those)\b/i,
    /\b(racial|ethnic)\s+slur/i,
    /\bviolence\s+against\b/i,
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(correctionText)) {
      return { isValid: false, reason: 'Correction contains inappropriate content' };
    }
  }
  
  try {
    // Call edge function for AI validation
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        messages: [
          { role: 'system', content: VALIDATION_SYSTEM_PROMPT },
          { role: 'user', content: buildValidationUserPrompt(originalResponse, correctionText, gameTitle) },
        ],
        model: 'gemini-3-flash-preview',
        temperature: 0.1,
        maxTokens: 200,
      },
    });
    
    if (error) {
      console.error('[CorrectionService] Validation API error:', error);
      // Fail closed - require manual review if AI validation unavailable
      // Queue the correction for later validation by storing with is_validated=false
      return { isValid: false, reason: 'Validation service temporarily unavailable. Please try again later.' };
    }
    
    // Parse AI response
    const responseText = data?.content || data?.response || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isValid: parsed.isValid === true,
        reason: parsed.reason || 'Validation complete',
        suggestedType: parsed.suggestedType || undefined,
      };
    }
    
    // Couldn't parse AI response - fail closed for safety
    console.warn('[CorrectionService] Could not parse validation response:', responseText);
    return { isValid: false, reason: 'Validation response was unclear. Please try again.' };
  } catch (error) {
    console.error('[CorrectionService] Validation exception:', error);
    // Fail closed for safety
    return { isValid: false, reason: 'Validation failed. Please try again later.' };
  }
}

// ============================================================================
// Submission
// ============================================================================

/**
 * Submit a correction (validates and stores)
 */
export async function submitCorrection(
  authUserId: string,
  submission: CorrectionSubmission
): Promise<{ success: boolean; error?: string; correction?: AICorrection }> {
  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return { 
      success: false, 
      error: `Daily correction limit reached (${MAX_CORRECTIONS_PER_DAY}/day). Try again tomorrow.` 
    };
  }
  
  // Validate the correction
  const validation = await validateCorrection(
    submission.originalResponse,
    submission.correctionText,
    submission.gameTitle
  );
  
  // Store in ai_feedback table (regardless of validation result for tracking)
  const { error: feedbackError } = await supabase
    .from('ai_feedback')
    .insert({
      user_id: authUserId,
      conversation_id: submission.conversationId,
      message_id: submission.messageId,
      feedback_type: 'down',
      content_type: 'message',
      category: 'correction',
      comment: submission.originalResponse.slice(0, 500),
      correction_text: submission.correctionText,
      correction_type: submission.type,
      correction_scope: submission.scope,
      is_validated: validation.isValid,
      validation_reason: validation.reason,
      game_title: submission.gameTitle,
    });
  
  if (feedbackError) {
    console.error('[CorrectionService] Failed to store feedback:', feedbackError);
    return { success: false, error: 'Failed to save correction' };
  }
  
  // If validation failed, return the reason
  if (!validation.isValid) {
    return { success: false, error: validation.reason };
  }
  
  // Add to behavior_data for quick access
  const result = await behaviorService.addCorrection(authUserId, {
    gameTitle: submission.gameTitle,
    originalSnippet: submission.originalResponse.slice(0, 200),
    correctionText: submission.correctionText,
    type: validation.suggestedType || submission.type,
    scope: submission.scope,
  });
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  // Increment rate limit
  incrementRateLimit();
  
  // Get the newly added correction
  const corrections = await behaviorService.getActiveCorrections(authUserId, submission.gameTitle);
  const newCorrection = corrections.find(c => c.correctionText === submission.correctionText);
  
  return { success: true, correction: newCorrection };
}

// ============================================================================
// Topic Extraction (for non-repetitive responses)
// ============================================================================

/**
 * Gaming-related keywords to extract as topics
 * More targeted patterns to avoid excessive false positives
 */
const GAMING_TOPIC_PATTERNS = [
  // Game mechanics - more specific
  /\b(boss(?:es)?|mini-boss|final boss)\b/gi,
  /\b(enemy types?|elite enemies|common enemies)\b/gi,
  /\b(legendary weapon|rare item|unique gear)\b/gi,
  /\b(skill tree|ability points?|talent build)\b/gi,
  /\b(main quest|side quest|daily quest)\b/gi,
  /\b(damage build|tank build|support build|dps build)\b/gi,
  
  // Specific gaming terms
  /\b(speedrun(?:ning)?|world record|personal best)\b/gi,
  /\b(secret area|hidden path|easter egg)\b/gi,
  /\b(tier list|meta build|optimal strategy)\b/gi,
  /\b(patch notes?|balance changes?|nerf(?:ed)?|buff(?:ed)?)\b/gi,
  /\b(dlc|expansion pack|season pass)\b/gi,
  
  // Avoid common words, focus on compound gaming terms
  /\b(game mechanics?|combat system|progression system)\b/gi,
  /\b(character build|loadout guide|equipment guide)\b/gi,
];

/**
 * Patterns to extract proper nouns (game names, character names, locations)
 * More restrictive to avoid matching common phrases
 */
const PROPER_NOUN_PATTERN = /\b([A-Z][a-z]{2,}(?:\s+(?:of|the|and)\s+)?[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g;

/**
 * Extract key topics from an AI response for tracking
 * Used to avoid repetitive content in future responses
 */
export function extractTopicsFromResponse(responseContent: string): string[] {
  if (!responseContent || responseContent.length < 100) {
    return [];
  }
  
  const topics = new Set<string>();
  
  // Extract gaming-related keywords (limited patterns)
  for (const pattern of GAMING_TOPIC_PATTERNS) {
    const matches = responseContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Normalize: lowercase and trim
        const normalized = match.toLowerCase().trim();
        // Only add multi-word or specific terms (avoid single common words)
        if (normalized.length >= 6 && normalized.length <= 50 && normalized.includes(' ')) {
          topics.add(normalized);
        }
      }
    }
  }
  
  // Extract proper nouns (game/character/location names) - limit to 5
  let properNounCount = 0;
  const properMatches = responseContent.match(PROPER_NOUN_PATTERN);
  if (properMatches) {
    for (const match of properMatches) {
      if (properNounCount >= 5) {
        break;
      }
      const normalized = match.toLowerCase().trim();
      if (normalized.length >= 6 && normalized.length <= 40) {
        topics.add(normalized);
        properNounCount++;
      }
    }
  }
  
  // Extract numbered contexts (for things like "Chapter 5", "Level 30")
  const numberContextPattern = /\b(chapter|level|stage|floor|wave|round|phase|part|episode|act)\s+(\d+)\b/gi;
  let match;
  while ((match = numberContextPattern.exec(responseContent)) !== null) {
    topics.add(`${match[1].toLowerCase()} ${match[2]}`);
  }
  
  // Limit to top 10 topics to avoid bloat (reduced from 20)
  return Array.from(topics).slice(0, 10);
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all corrections for a user (from database)
 */
export async function getAllCorrections(authUserId: string): Promise<AICorrection[]> {
  const behaviorData = await behaviorService.getBehaviorData(authUserId);
  return behaviorData.aiCorrections;
}

/**
 * Get corrections relevant to current context
 */
export async function getContextualCorrections(
  authUserId: string,
  gameTitle: string | null
): Promise<AICorrection[]> {
  return behaviorService.getActiveCorrections(authUserId, gameTitle, true);
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(): { allowed: boolean; remaining: number } {
  return checkRateLimit();
}

// ============================================================================
// Exports
// ============================================================================

export const correctionService = {
  validateCorrection,
  submitCorrection,
  getAllCorrections,
  getContextualCorrections,
  getRateLimitStatus,
  extractTopicsFromResponse,
  
  // Re-export from behaviorService for convenience
  toggleCorrection: behaviorService.toggleCorrection,
  removeCorrection: behaviorService.removeCorrection,
};
