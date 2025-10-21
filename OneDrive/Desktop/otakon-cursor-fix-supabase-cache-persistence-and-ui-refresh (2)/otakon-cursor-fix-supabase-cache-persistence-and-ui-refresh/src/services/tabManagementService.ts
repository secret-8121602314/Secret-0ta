import { Conversation, SubTab } from '../types';

/**
 * Tab Management Service (Command Centre)
 * 
 * Handles parsing and execution of @ commands for managing subtabs.
 * Based on the old build's Command Centre feature.
 * 
 * Command Formats:
 * - @<tab_name> <instruction>: Update tab with new content
 * - @<tab_name> \modify <instruction>: Modify/rename tab
 * - @<tab_name> \delete: Delete tab
 */

export interface TabCommand {
  type: 'update' | 'modify' | 'delete';
  tabId: string;
  tabName: string;
  instruction: string;
}

class TabManagementService {
  /**
   * Check if message contains a tab management command
   */
  public hasTabCommand(message: string): boolean {
    // Check for @ followed by word characters
    return /^@\w+/.test(message.trim());
  }

  /**
   * Parse tab command from user message
   * Returns null if no valid command found
   */
  public parseTabCommand(message: string, conversation: Conversation): TabCommand | null {
    const trimmedMessage = message.trim();
    
    if (!this.hasTabCommand(trimmedMessage)) {
      return null;
    }

    // Extract command parts: @<tab_name> [\\modify|\\delete] [instruction]
    const commandMatch = trimmedMessage.match(/^@(\w+)\s*(\\modify|\\delete)?\s*(.*)$/);
    
    if (!commandMatch) {
      return null;
    }

    const [, tabName, modifier, instruction] = commandMatch;
    
    // Find matching subtab (case-insensitive, fuzzy match)
    const matchingTab = this.findMatchingTab(tabName, conversation.subtabs || []);
    
    if (!matchingTab) {
      console.warn(`Tab "${tabName}" not found in conversation`);
      return null;
    }

    // Determine command type
    let commandType: 'update' | 'modify' | 'delete';
    if (modifier === '\\delete') {
      commandType = 'delete';
    } else if (modifier === '\\modify') {
      commandType = 'modify';
    } else {
      commandType = 'update';
    }

    return {
      type: commandType,
      tabId: matchingTab.id,
      tabName: matchingTab.title,
      instruction: instruction.trim()
    };
  }

  /**
   * Find matching subtab by name (fuzzy match)
   * Handles variations like "story_so_far", "story so far", "story", etc.
   */
  private findMatchingTab(searchName: string, subtabs: SubTab[]): SubTab | null {
    const normalizedSearch = this.normalizeTabName(searchName);
    
    // First try exact match
    let match = subtabs.find(tab => 
      this.normalizeTabName(tab.id) === normalizedSearch ||
      this.normalizeTabName(tab.title) === normalizedSearch
    );
    
    if (match) return match;
    
    // Then try partial match (search term is contained in tab name)
    match = subtabs.find(tab => 
      this.normalizeTabName(tab.id).includes(normalizedSearch) ||
      this.normalizeTabName(tab.title).includes(normalizedSearch)
    );
    
    if (match) return match;
    
    // Finally try reversed partial match (tab name is contained in search term)
    match = subtabs.find(tab => 
      normalizedSearch.includes(this.normalizeTabName(tab.id)) ||
      normalizedSearch.includes(this.normalizeTabName(tab.title))
    );
    
    return match || null;
  }

  /**
   * Normalize tab name for comparison
   */
  private normalizeTabName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[_\s-]+/g, '')  // Remove separators
      .replace(/[^a-z0-9]/g, ''); // Remove special chars
  }

  /**
   * Get available tab names for autocomplete
   */
  public getAvailableTabNames(conversation: Conversation): string[] {
    if (!conversation.subtabs || conversation.subtabs.length === 0) {
      return [];
    }

    return conversation.subtabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      // Create multiple search variations
      variations: [
        tab.id,
        tab.title,
        tab.id.replace(/_/g, ' '),
        tab.title.toLowerCase()
      ]
    }))
    // Return primary names (tab IDs for consistency)
    .map(tab => tab.id);
  }

  /**
   * Format command for display in autocomplete
   */
  public formatTabSuggestion(tabId: string, _tabTitle: string): string {
    return `@${tabId}`;
  }

  /**
   * Get command help text
   */
  public getCommandHelp(): string {
    return `
**Tab Commands:**
• @<tab> <text> - Update tab with new info
• @<tab> \\modify <text> - Modify/rename tab
• @<tab> \\delete - Delete tab

Example: @story_so_far The player defeated the first boss
    `.trim();
  }

  /**
   * Validate command before sending to AI
   */
  public validateCommand(command: TabCommand): { valid: boolean; error?: string } {
    switch (command.type) {
      case 'update':
        if (!command.instruction) {
          return { valid: false, error: 'Update command requires content. Example: @story_so_far The player...' };
        }
        break;
      
      case 'modify':
        if (!command.instruction) {
          return { valid: false, error: 'Modify command requires instructions. Example: @tips \\modify Change to combat strategies' };
        }
        break;
      
      case 'delete':
        // Delete doesn't need instruction
        break;
    }

    return { valid: true };
  }

  /**
   * Get user-friendly description of command
   */
  public describeCommand(command: TabCommand): string {
    switch (command.type) {
      case 'update':
        return `Updating "${command.tabName}" with: ${command.instruction}`;
      case 'modify':
        return `Modifying "${command.tabName}": ${command.instruction}`;
      case 'delete':
        return `Deleting "${command.tabName}"`;
    }
  }
}

export const tabManagementService = new TabManagementService();

