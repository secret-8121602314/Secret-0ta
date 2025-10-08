import { newsPrompts } from '../types';

class SuggestedPromptsService {
  /**
   * Get static news prompts for the "Everything Else" tab
   */
  public getStaticNewsPrompts(): string[] {
    // Returns a shuffled array of 4 news prompts
    return [...newsPrompts].sort(() => 0.5 - Math.random());
  }

  /**
   * Process AI-generated suggestions and format them for display
   */
  public processAISuggestions(suggestions: any): string[] {
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
      } catch (e) {
        console.log('🔍 [SuggestedPromptsService] JSON parsing failed, trying delimiter splitting');
        // If JSON parsing fails, try to split by common delimiters
        if (cleanedSuggestions.includes('", "') || cleanedSuggestions.includes('",\n"')) {
          // Split by comma and clean up
          suggestionsArray = cleanedSuggestions
            .split(/",\s*"/)
            .map(s => s.replace(/^["\s]+|["\s]+$/g, ''))
            .filter(s => s.length > 0);
          console.log('🔍 [SuggestedPromptsService] Split by comma delimiters');
        } else if (cleanedSuggestions.includes('", "')) {
          suggestionsArray = cleanedSuggestions
            .split('", "')
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
   * Get fallback suggestions if AI doesn't provide any
   */
  public getFallbackSuggestions(conversationId: string): string[] {
    if (conversationId === 'everything-else') {
      return this.getStaticNewsPrompts();
    }
    
    // Game-specific fallback suggestions
    return [
      "What should I do next in this area?",
      "Tell me about the story so far",
      "Give me some tips for this game"
    ];
  }
}

export const suggestedPromptsService = new SuggestedPromptsService();
