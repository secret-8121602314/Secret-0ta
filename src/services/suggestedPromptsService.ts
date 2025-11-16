import { newsPrompts } from '../types';

class SuggestedPromptsService {
  private readonly STORAGE_KEY = 'otakon_used_suggested_prompts';
  private readonly LAST_RESET_KEY = 'otakon_suggested_prompts_last_reset';
  private readonly RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private usedPrompts: Set<string> = new Set();

  constructor() {
    this.loadUsedPrompts();
    this.checkAndResetIfNeeded();
  }

  private loadUsedPrompts(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const prompts = JSON.parse(stored);
        this.usedPrompts = new Set(prompts);
      }
    } catch (error) {
      console.warn('Failed to load used suggested prompts:', error);
      this.usedPrompts = new Set();
    }
  }

  private saveUsedPrompts(): void {
    try {
      const prompts = Array.from(this.usedPrompts);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prompts));
    } catch (error) {
      console.warn('Failed to save used suggested prompts:', error);
    }
  }

  /**
   * Check if 24 hours have passed since last reset and reset if needed
   */
  private checkAndResetIfNeeded(): void {
    try {
      const lastResetTime = localStorage.getItem(this.LAST_RESET_KEY);
      const now = Date.now();
      
      if (!lastResetTime || (now - parseInt(lastResetTime)) >= this.RESET_INTERVAL_MS) {
        console.log('🔄 24 hours passed - resetting suggested prompts for fresh daily news');
        this.resetUsedPrompts();
        localStorage.setItem(this.LAST_RESET_KEY, now.toString());
      }
    } catch (error) {
      console.warn('Failed to check/reset suggested prompts:', error);
    }
  }

  /**
   * Mark a prompt as used
   */
  public markPromptAsUsed(prompt: string): void {
    this.usedPrompts.add(prompt);
    this.saveUsedPrompts();
  }

  /**
   * Check if a prompt has been used
   */
  public isPromptUsed(prompt: string): boolean {
    return this.usedPrompts.has(prompt);
  }

  /**
   * Get all unused prompts from a list
   */
  public getUnusedPrompts(prompts: string[]): string[] {
    return prompts.filter(prompt => !this.isPromptUsed(prompt));
  }

  /**
   * Check if all prompts have been used
   */
  public areAllPromptsUsed(prompts: string[]): boolean {
    return prompts.every(prompt => this.isPromptUsed(prompt));
  }

  /**
   * Reset used prompts (called on app restart, login, or 24-hour interval)
   */
  public resetUsedPrompts(): void {
    this.usedPrompts.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔄 Suggested prompts reset - all 4 prompts will be available again');
  }

  /**
   * Get count of used prompts
   */
  public getUsedCount(): number {
    return this.usedPrompts.size;
  }

  /**
   * Get time until next reset (in milliseconds)
   */
  public getTimeUntilNextReset(): number {
    try {
      const lastResetTime = localStorage.getItem(this.LAST_RESET_KEY);
      if (!lastResetTime) {
        return 0;
      }
      
      const nextResetTime = parseInt(lastResetTime) + this.RESET_INTERVAL_MS;
      return Math.max(0, nextResetTime - Date.now());
    } catch (error) {
      console.warn('Failed to calculate time until next reset:', error);
      return 0;
    }
  }

  /**
   * Get static news prompts for the "Game Hub" tab
   */
  public getStaticNewsPrompts(): string[] {
    // Returns array of 4 news prompts (not shuffled to maintain consistency)
    return newsPrompts;
  }

  /**
   * Process AI-generated suggestions and format them for display
   */
  public processAISuggestions(suggestions: unknown): string[] {
    console.log('🔍 [SuggestedPromptsService] Input suggestions:', suggestions, 'Type:', typeof suggestions);
    
    // Handle different types of suggestions
    if (!suggestions) {
      console.log('🔍 [SuggestedPromptsService] No suggestions provided');
      return [];
    }
    
    let suggestionsArray: string[] = [];
    
    if (Array.isArray(suggestions)) {
      console.log('🔍 [SuggestedPromptsService] Suggestions is already an array');
      suggestionsArray = suggestions;
    } else if (typeof suggestions === 'string') {
      console.log('🔍 [SuggestedPromptsService] Suggestions is a string, attempting to parse');
      
      // Clean up common formatting issues first
      let cleanedSuggestions = suggestions.trim();
      
      // Fix malformed JSON arrays that start with [" but might be incomplete
      if (cleanedSuggestions.startsWith('["') && !cleanedSuggestions.endsWith('"]')) {
        // Try to fix incomplete JSON arrays
        if (!cleanedSuggestions.endsWith('"')) {
          cleanedSuggestions += '"';
        }
        if (!cleanedSuggestions.endsWith(']')) {
          cleanedSuggestions += ']';
        }
        console.log('🔍 [SuggestedPromptsService] Fixed malformed JSON array:', cleanedSuggestions);
      }
      
      // If it's a string, try to parse it as JSON
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(cleanedSuggestions);
        if (Array.isArray(parsed)) {
          suggestionsArray = parsed;
          console.log('🔍 [SuggestedPromptsService] Successfully parsed as JSON array');
        } else {
          suggestionsArray = [suggestions];
          console.log('🔍 [SuggestedPromptsService] Parsed as single value, wrapped in array');
        }
      } catch (_e) {
        console.log('🔍 [SuggestedPromptsService] JSON parsing failed, trying delimiter splitting');
        // If JSON parsing fails, try to split by common delimiters
        if (cleanedSuggestions.includes('", "') || cleanedSuggestions.includes('",\n"')) {
          // Split by comma and clean up
          suggestionsArray = cleanedSuggestions
            .split(/",\s*"/)
            .map(s => s.replace(/^["\s]+|["\s]+$/g, ''))
            .filter(s => s.length > 0);
          console.log('🔍 [SuggestedPromptsService] Split by comma delimiters');
        } else if (cleanedSuggestions.includes('\n')) {
          // Split by newlines for multi-line format
          suggestionsArray = cleanedSuggestions
            .split('\n')
            .map(s => s.replace(/^["\s]+|["\s]+$/g, ''))
            .filter(s => s.length > 0);
          console.log('🔍 [SuggestedPromptsService] Split by quote delimiters');
        } else {
          // Single suggestion
          suggestionsArray = [suggestions];
          console.log('🔍 [SuggestedPromptsService] Treated as single suggestion');
        }
      }
    }
    
    console.log('🔍 [SuggestedPromptsService] Raw suggestions array:', suggestionsArray);
    
    // Clean and format suggestions
    const result = suggestionsArray
      .filter(suggestion => suggestion && typeof suggestion === 'string' && suggestion.trim().length > 0)
      .map(suggestion => suggestion.trim())
      .slice(0, 3); // Limit to 3 suggestions
    
    console.log('🔍 [SuggestedPromptsService] Final processed suggestions:', result);
    return result;
  }

  /**
   * Get fallback suggestions when AI doesn't provide any
   * Returns news prompts for Game Hub, game-specific prompts for game tabs
   */
  public getFallbackSuggestions(conversationId: string, isGameHub?: boolean): string[] {
    // Import GAME_HUB_ID constant for consistency
    const GAME_HUB_ID = 'game-hub';
    
    // ✅ Explicit Game Hub check with multiple conditions
    const isActuallyGameHub = isGameHub === true || 
      conversationId === GAME_HUB_ID || 
      conversationId === 'everything-else';
    
    if (isActuallyGameHub) {
      // Game Hub: Return 4 static news prompts
      return this.getStaticNewsPrompts();
    }
    
    // ✅ Game-specific tabs: Return contextual game prompts
    // These prompts work for ANY game (not news-related)
    return [
      "What should I do next in this area?",
      "Tell me about the story so far",
      "Give me some tips for this game",
      "What are the key mechanics I should know?"
    ];
  }
}

export const suggestedPromptsService = new SuggestedPromptsService();

