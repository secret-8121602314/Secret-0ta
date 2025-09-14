import { PlayerProfile, GameContext, ResponseFormatting, ResponseSection } from './types';

class StructuredResponseService {
  private static instance: StructuredResponseService;
  
  static getInstance(): StructuredResponseService {
    if (!StructuredResponseService.instance) {
      StructuredResponseService.instance = new StructuredResponseService();
    }
    return StructuredResponseService.instance;
  }

  // Analyze user intent and context
  analyzeUserIntent(
    currentMessage: string,
    conversationHistory: string[],
    lastGameId: string,
    currentGameId: string
  ): 'new_help' | 'clarification' | 'follow_up' | 'game_switch' {
    
    // Check for game switching
    if (lastGameId !== currentGameId && lastGameId !== '') {
      return 'game_switch';
    }
    
    // Check for follow-up questions
    const followUpIndicators = [
      'what about', 'how do i', 'can you explain', 'tell me more',
      'what next', 'and then', 'also', 'additionally', 'continue',
      'expand on', 'elaborate', 'go deeper', 'what else',
      'anything else', 'other options', 'more details'
    ];
    
    const isFollowUp = followUpIndicators.some(indicator => 
      currentMessage.toLowerCase().includes(indicator)
    );
    
    if (isFollowUp) {
      return 'follow_up';
    }
    
    // Check for clarification requests
    const clarificationIndicators = [
      'i don\'t understand', 'can you clarify', 'what do you mean',
      'i\'m confused', 'explain better', 'not clear', 'unclear',
      'what does that mean', 'i don\'t get it', 'huh?',
      'i\'m lost', 'help me understand', 'break it down'
    ];
    
    const isClarification = clarificationIndicators.some(indicator => 
      currentMessage.toLowerCase().includes(indicator)
    );
    
    if (isClarification) {
      return 'clarification';
    }
    
    return 'new_help';
  }

  // Generate structured response format based on intent and profile
  generateResponseStructure(
    intent: 'new_help' | 'clarification' | 'follow_up' | 'game_switch',
    playerProfile: PlayerProfile,
    gameContext: GameContext
  ): ResponseFormatting {
    
    const formatting: ResponseFormatting = {
      useHeaders: true,
      useBulletPoints: true,
      useNumberedLists: false,
      useCallouts: false,
      useProgressIndicators: false
    };

    // Adapt formatting based on player preferences
    switch (playerProfile.hintStyle) {
      case 'Cryptic':
        formatting.useHeaders = false;
        formatting.useBulletPoints = false;
        formatting.useCallouts = true;
        break;
      case 'Balanced':
        formatting.useHeaders = true;
        formatting.useBulletPoints = true;
        formatting.useNumberedLists = true;
        break;
      case 'Direct':
        formatting.useHeaders = true;
        formatting.useBulletPoints = true;
        formatting.useNumberedLists = true;
        formatting.useProgressIndicators = true;
        break;
    }

    // Adapt based on player focus
    switch (playerProfile.playerFocus) {
      case 'Completionist':
        formatting.useProgressIndicators = true;
        formatting.useNumberedLists = true;
        break;
      case 'Strategist':
        formatting.useHeaders = true;
        formatting.useBulletPoints = true;
        break;
      case 'Story-Driven':
        formatting.useCallouts = true;
        formatting.useHeaders = false;
        break;
    }

    return formatting;
  }

  // Create response sections based on intent
  createResponseSections(
    intent: 'new_help' | 'clarification' | 'follow_up' | 'game_switch',
    gameContext: GameContext,
    playerProfile: PlayerProfile
  ): ResponseSection[] {
    
    const sections: ResponseSection[] = [];

    switch (intent) {
      case 'new_help':
        sections.push({
          id: 'current_situation',
          title: 'Current Situation',
          content: 'Analysis of what you\'re experiencing right now',
          priority: 'high'
        });
        
        if (playerProfile.playerFocus === 'Strategist') {
          sections.push({
            id: 'tactical_advice',
            title: 'Tactical Approach',
            content: 'Strategic recommendations for your current challenge',
            priority: 'high'
          });
        }
        
        if (playerProfile.playerFocus === 'Completionist') {
          sections.push({
            id: 'exploration_tips',
            title: 'Exploration Tips',
            content: 'Secrets and collectibles you might find nearby',
            priority: 'medium'
          });
        }
        break;

      case 'follow_up':
        sections.push({
          id: 'additional_guidance',
          title: 'Building on Previous Help',
          content: 'Expanding on what we discussed earlier',
          priority: 'high'
        });
        
        sections.push({
          id: 'next_steps',
          title: 'Next Steps',
          content: 'What to do with this new information',
          priority: 'medium'
        });
        break;

      case 'game_switch':
        sections.push({
          id: 'welcome_back',
          title: 'Welcome Back!',
          content: 'Quick recap of where you left off',
          priority: 'high'
        });
        
        sections.push({
          id: 'current_objectives',
          title: 'Current Objectives',
          content: 'What you were working on',
          priority: 'high'
        });
        break;

      case 'clarification':
        sections.push({
          id: 'clarifying_question',
          title: 'Clarifying Your Question',
          content: 'Restate what you think they\'re asking',
          priority: 'high'
        });
        
        sections.push({
          id: 'breaking_it_down',
          title: 'Breaking It Down',
          content: 'Step-by-step explanation',
          priority: 'high'
        });
        
        sections.push({
          id: 'key_points',
          title: 'Key Points',
          content: 'Important takeaways',
          priority: 'medium'
        });
        break;
    }

    return sections;
  }

  // Generate formatting instructions for AI
  generateFormattingInstructions(
    formatting: ResponseFormatting,
    intent: string,
    playerProfile: PlayerProfile
  ): string {
    let instructions = '**RESPONSE STRUCTURE REQUIREMENTS:**\n';
    
    if (formatting.useHeaders) {
      instructions += '- Use clear section headers (## or ###) to break up your response\n';
    }
    
    if (formatting.useBulletPoints) {
      instructions += '- Use bullet points for actionable items and lists\n';
    }
    
    if (formatting.useNumberedLists) {
      instructions += '- Use numbered lists for step-by-step guidance\n';
    }
    
    if (formatting.useCallouts) {
      instructions += '- Use callout boxes for important information: > **💡 Pro Tip:** [content]\n';
    }
    
    if (formatting.useProgressIndicators) {
      instructions += '- Include progress indicators when relevant (e.g., "Progress: 45% - You\'re in the mid-game phase")\n';                                                                                          
    }

    // Add intent-specific formatting
    instructions += `\n**INTENT-SPECIFIC RESPONSE PATTERN: ${intent.toUpperCase()}**\n`;
    
    switch (intent) {
      case 'new_help':
        instructions += `
## 🆕 Current Challenge
[2-3 sentences about what they need help with]

## 🎯 Context & Progress  
[Reference to their current situation and progress]

## 🚀 Action Plan
- [Specific action 1]
- [Specific action 2] 
- [Specific action 3]

## 💡 Additional Context
[Relevant background information]`;
        break;
        
      case 'follow_up':
        instructions += `
## 🔄 Building on Previous Help
[Reference to what we discussed earlier]

## 📈 Current Situation Update
[How their situation has evolved]

## 🎯 Next Steps
[What to do with the new information]

## 💡 Related Insights
[Additional helpful context]`;
        break;
        
      case 'game_switch':
        instructions += `
## 🎮 New Game Detected
[Game name and basic information]

## 🔄 Transitioning Context
[What to expect in this new game]

## 📋 Setting Up Your Experience
[How your preferences will apply here]

## 🚀 Getting Started
[First steps in the new game]`;
        break;
        
      case 'clarification':
        instructions += `
## ❓ Clarifying Your Question
[Restate what you think they're asking]

## 🔍 Breaking It Down
[Step-by-step explanation]

## 💡 Key Points
- [Important point 1]
- [Important point 2]
- [Important point 3]

## ✅ Does This Help?
[Ask if they need further clarification]`;
        break;
    }

    return instructions;
  }
}

export const structuredResponseService = StructuredResponseService.getInstance();
