import { PlayerProfile, InsightTab, GameContext } from './types';
import { playerProfileService } from './playerProfileService';

export interface EnhancedInsightTab extends InsightTab {
    priority: 'high' | 'medium' | 'low';
    playerFocus: string[];
    hintStyle: string[];
    isProfileSpecific: boolean;
    customInstruction?: string;
}

export interface ProfileAwareInsightConfig {
    tabs: EnhancedInsightTab[];
    contentInstructions: Record<string, string>;
    responseFormatting: Record<string, any>;
}

class EnhancedInsightService {
    private static instance: EnhancedInsightService;
    
    private constructor() {}
    
    static getInstance(): EnhancedInsightService {
        if (!EnhancedInsightService.instance) {
            EnhancedInsightService.instance = new EnhancedInsightService();
        }
        return EnhancedInsightService.instance;
    }

    /**
     * Generate profile-aware insight tabs based on user preferences
     */
    generateProfileAwareTabs(
        genre: string,
        playerProfile: PlayerProfile,
        gameContext: GameContext
    ): EnhancedInsightTab[] {
        const baseTabs = this.getBaseTabsForGenre(genre);
        const profileTabs = this.generateProfileSpecificTabs(playerProfile, gameContext);
        
        // Merge and prioritize tabs based on profile
        const allTabs = [...baseTabs, ...profileTabs];
        return this.prioritizeTabsForProfile(allTabs, playerProfile);
    }

    /**
     * Get base tabs for a specific genre
     */
    private getBaseTabsForGenre(genre: string): EnhancedInsightTab[] {
        const baseConfig = insightTabsConfig[genre] || insightTabsConfig.default;
        
        return baseConfig.map(tab => ({
            ...tab,
            priority: 'medium',
            playerFocus: [],
            hintStyle: [],
            isProfileSpecific: false
        }));
    }

    /**
     * Generate profile-specific tabs based on player focus and preferences
     */
    private generateProfileSpecificTabs(
        playerProfile: PlayerProfile,
        gameContext: GameContext
    ): EnhancedInsightTab[] {
        const profileTabs: EnhancedInsightTab[] = [];

        // Story-Driven focus tabs
        if (playerProfile.playerFocus === 'Story-Driven') {
            profileTabs.push({
                id: 'character_relationships',
                title: 'Character Relationships',
                instruction: this.getStoryDrivenInstruction(playerProfile.hintStyle),
                priority: 'high',
                playerFocus: ['Story-Driven'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('character_relationships', playerProfile)
            });

            profileTabs.push({
                id: 'narrative_themes',
                title: 'Narrative Themes',
                instruction: this.getNarrativeThemesInstruction(playerProfile.hintStyle),
                priority: 'medium',
                playerFocus: ['Story-Driven'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('narrative_themes', playerProfile)
            });
        }

        // Completionist focus tabs
        if (playerProfile.playerFocus === 'Completionist') {
            profileTabs.push({
                id: 'completion_checklist',
                title: 'Completion Checklist',
                instruction: this.getCompletionistInstruction(playerProfile.hintStyle),
                priority: 'high',
                playerFocus: ['Completionist'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('completion_checklist', playerProfile)
            });

            profileTabs.push({
                id: 'secret_hunting',
                title: 'Secret Hunting Guide',
                instruction: this.getSecretHuntingInstruction(playerProfile.hintStyle),
                priority: 'high',
                playerFocus: ['Completionist'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('secret_hunting', playerProfile)
            });
        }

        // Strategist focus tabs
        if (playerProfile.playerFocus === 'Strategist') {
            profileTabs.push({
                id: 'meta_analysis',
                title: 'Meta Analysis',
                instruction: this.getStrategistInstruction(playerProfile.hintStyle),
                priority: 'high',
                playerFocus: ['Strategist'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('meta_analysis', playerProfile)
            });

            profileTabs.push({
                id: 'optimization_guide',
                title: 'Optimization Guide',
                instruction: this.getOptimizationInstruction(playerProfile.hintStyle),
                priority: 'high',
                playerFocus: ['Strategist'],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('optimization_guide', playerProfile)
            });
        }

        // Add playthrough-specific tabs for returning players
        if (gameContext.playthroughCount > 1) {
            profileTabs.push({
                id: 'playthrough_comparison',
                title: 'Playthrough Comparison',
                instruction: this.getPlaythroughComparisonInstruction(playerProfile),
                priority: 'medium',
                playerFocus: [playerProfile.playerFocus],
                hintStyle: [playerProfile.hintStyle],
                isProfileSpecific: true,
                customInstruction: this.generateCustomInstruction('playthrough_comparison', playerProfile)
            });
        }

        return profileTabs;
    }

    /**
     * Generate custom instructions based on player profile
     */
    private generateCustomInstruction(tabType: string, profile: PlayerProfile): string {
        const baseInstructions = {
            character_relationships: "Analyze the relationships between characters you've encountered so far, focusing on their motivations, conflicts, and how they relate to your journey.",
            narrative_themes: "Identify the key themes and motifs in the story so far, exploring how they're developed through characters, events, and world-building.",
            completion_checklist: "Create a comprehensive checklist of collectibles, achievements, and side content available in areas you've already visited.",
            secret_hunting: "Provide detailed hints about hidden areas, secret items, and easter eggs you might have missed, using your preferred hint style.",
            meta_analysis: "Analyze the game's systems, mechanics, and balance from a strategic perspective, identifying optimal approaches and potential exploits.",
            optimization_guide: "Provide detailed optimization strategies for your current situation, focusing on efficiency and strategic advantage.",
            playthrough_comparison: "Compare your current playthrough with previous ones, highlighting differences, new discoveries, and alternative approaches."
        };

        const baseInstruction = baseInstructions[tabType] || "";
        
        // Customize based on hint style
        const styleModifiers = {
            'Cryptic': "Use mysterious, enigmatic language that requires interpretation. Drop subtle clues rather than direct answers.",
            'Balanced': "Provide a mix of direct information and subtle hints, allowing the player to discover details on their own.",
            'Direct': "Give clear, straightforward information and actionable advice without unnecessary mystery."
        };

        const toneModifiers = {
            'Encouraging': "Maintain an encouraging, supportive tone that celebrates the player's progress and discoveries.",
            'Professional': "Use a professional, analytical tone focused on providing clear, useful information.",
            'Casual': "Keep the tone friendly and conversational, as if chatting with a fellow gamer."
        };

        return `${baseInstruction} ${styleModifiers[profile.hintStyle]}. ${toneModifiers[profile.preferredTone]}.`;
    }

    /**
     * Get story-driven instructions based on hint style
     */
    private getStoryDrivenInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': "Unravel the web of connections between characters you've met. Look for the subtle signs of deeper relationships hidden in their words and actions.",
            'Balanced': "Explore the character dynamics and relationships you've discovered, considering both obvious connections and subtle hints.",
            'Direct': "Analyze the clear relationships and connections between characters you've encountered, focusing on their roles in the story."
        };
        return instructions[hintStyle] || instructions['Balanced'];
    }

    /**
     * Get completionist instructions based on hint style
     */
    private getCompletionistInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': "The path to completion holds many secrets. Some treasures lie in plain sight, while others require a keen eye for the unusual.",
            'Balanced': "Identify collectibles and achievements you might have missed, balancing thorough exploration with efficient progress.",
            'Direct': "Create a comprehensive list of all collectibles, achievements, and side content available in areas you've visited."
        };
        return instructions[hintStyle] || instructions['Balanced'];
    }

    /**
     * Get strategist instructions based on hint style
     */
    private getStrategistInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': "The game's systems hold hidden depths. Look beyond the obvious to discover the true mechanics that drive success.",
            'Balanced': "Analyze the game's systems and mechanics, identifying both obvious strategies and subtle optimizations.",
            'Direct': "Provide a detailed analysis of the game's systems, mechanics, and optimal strategies for your current situation."
        };
        return instructions[hintStyle] || instructions['Balanced'];
    }

    /**
     * Get narrative themes instructions based on hint style
     */
    private getNarrativeThemesInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': "The story weaves deeper meanings beneath its surface. Look for the patterns and symbols that reveal the true narrative.",
            'Balanced': "Explore the themes and motifs present in the story, considering both obvious elements and subtle symbolism.",
            'Direct': "Identify and analyze the key themes, motifs, and narrative elements present in the story so far."
        };
        return instructions[hintStyle] || instructions['Balanced'];
    }

    /**
     * Get secret hunting instructions based on hint style
     */
    private getSecretHuntingInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': "Secrets hide in the shadows of the obvious. Look for what doesn't belong, what seems out of place, and what calls for deeper investigation.",
            'Balanced': "Provide hints about hidden areas and secrets, balancing revelation with the joy of discovery.",
            'Direct': "Give clear directions and information about hidden areas, secret items, and easter eggs you might have missed."
        };
        return instructions[hintStyle] || instructions['Balanced'];
    }

    /**
     * Get optimization instructions based on hint style
     */
    private getOptimizationInstruction(hintStyle: string): string {
        const instructions = {
            'Cryptic': "Efficiency lies in understanding the hidden patterns. Look for the subtle optimizations that others might miss.",
            'Balanced': "Provide optimization strategies that balance effectiveness with accessibility, suitable for various skill levels.",
            'Direct': "Give specific, actionable optimization advice for your current situation, focusing on maximum efficiency and strategic advantage."
        };
        return instructions[hintStyle] || instructions['Balanced'];
    }

    /**
     * Get playthrough comparison instructions
     */
    private getPlaythroughComparisonInstruction(profile: PlayerProfile): string {
        const baseInstruction = "Compare your current playthrough with previous ones, highlighting differences, new discoveries, and alternative approaches.";
        
        const focusModifiers = {
            'Story-Driven': "Focus on narrative choices, character interactions, and story variations you've discovered.",
            'Completionist': "Emphasize new collectibles, achievements, and side content you're finding in this playthrough.",
            'Strategist': "Analyze how different strategies and approaches are affecting your progress and outcomes."
        };

        return `${baseInstruction} ${focusModifiers[profile.playerFocus]}`;
    }

    /**
     * Prioritize tabs based on player profile and preferences
     */
    private prioritizeTabsForProfile(
        tabs: EnhancedInsightTab[],
        profile: PlayerProfile
    ): EnhancedInsightTab[] {
        return tabs.sort((a, b) => {
            // Profile-specific tabs get higher priority
            if (a.isProfileSpecific && !b.isProfileSpecific) return -1;
            if (!a.isProfileSpecific && b.isProfileSpecific) return 1;
            
            // Higher priority tabs come first
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) return bPriority - aPriority;
            
            // Profile-specific tabs with matching focus come first
            if (a.isProfileSpecific && a.playerFocus.includes(profile.playerFocus)) return -1;
            if (b.isProfileSpecific && b.playerFocus.includes(profile.playerFocus)) return 1;
            
            return 0;
        });
    }

    /**
     * Generate content instructions for AI based on profile
     */
    generateContentInstructions(
        tab: EnhancedInsightTab,
        profile: PlayerProfile,
        gameContext: GameContext
    ): string {
        const baseInstruction = tab.customInstruction || tab.instruction;
        
        // Add profile-specific context
        const profileContext = `
**Player Profile Context:**
- Focus: ${profile.playerFocus}
- Hint Style: ${profile.hintStyle}
- Preferred Tone: ${profile.preferredTone}
- Spoiler Tolerance: ${profile.spoilerTolerance}
- Playthrough Count: ${gameContext.playthroughCount}
- Total Play Time: ${Math.round(gameContext.totalPlayTime / 60000)} minutes

**Response Requirements:**
- Use ${profile.hintStyle.toLowerCase()} hint style
- Maintain ${profile.preferredTone.toLowerCase()} tone
- Respect ${profile.spoilerTolerance.toLowerCase()} spoiler tolerance
- Consider this is playthrough #${gameContext.playthroughCount}
- Provide detailed, actionable content
- Use structured formatting with headers and bullet points
`;

        return `${baseInstruction}\n\n${profileContext}`;
    }
}

export const enhancedInsightService = EnhancedInsightService.getInstance();
