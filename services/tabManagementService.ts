import { TabCommand, TabCommandResult, TabModificationCommand, TabDeletionCommand } from './types';

export class TabManagementService {
  private static instance: TabManagementService;
  
  private constructor() {}
  
  static getInstance(): TabManagementService {
    if (!TabManagementService.instance) {
      TabManagementService.instance = new TabManagementService();
    }
    return TabManagementService.instance;
  }

  /**
   * Parse natural language text and convert it to tab commands
   */
  parseTabCommand(text: string): TabCommand | null {
    const lowerText = text.toLowerCase().trim();
    
    // Add tab commands
    if (lowerText.includes('add tab') || lowerText.includes('create tab') || lowerText.includes('new tab')) {
      const title = this.extractTitle(text);
      if (title) {
        return {
          action: 'add',
          title,
          content: this.extractContent(text) || undefined
        };
      }
    }
    
    // Modify tab commands
    if (lowerText.includes('modify tab') || lowerText.includes('edit tab') || lowerText.includes('change tab')) {
      const tabId = this.extractTabId(text);
      const title = this.extractTitle(text);
      if (tabId && title) {
        return {
          action: 'modify',
          tabId,
          title,
          content: this.extractContent(text) || undefined
        };
      }
    }
    
    // Delete tab commands
    if (lowerText.includes('delete tab') || lowerText.includes('remove tab') || lowerText.includes('drop tab')) {
      const tabId = this.extractTabId(text);
      if (tabId) {
        return {
          action: 'delete',
          tabId,
          confirmation: lowerText.includes('confirm') || lowerText.includes('yes')
        };
      }
    }
    
    // Reorder tab commands
    if (lowerText.includes('move tab') || lowerText.includes('reorder tab') || lowerText.includes('position tab')) {
      const tabId = this.extractTabId(text);
      const position = this.extractPosition(text);
      if (tabId && position !== null) {
        return {
          action: 'modify',
          tabId,
          title: '', // Will be preserved
          position
        };
      }
    }
    
    return null;
  }

  /**
   * Execute a tab command and return the result
   */
  async executeTabCommand(
    command: TabCommand,
    currentTabs: Array<{ id: string; title: string; content: string }>,
    onTabUpdate: (tabs: Array<{ id: string; title: string; content: string }>) => void
  ): Promise<TabCommandResult> {
    try {
      let updatedTabs = [...currentTabs];
      
      if (command.action === 'add') {
        const newTab = {
          id: `tab_${Date.now()}`,
          title: command.title,
          content: command.content || `Content for ${command.title}`
        };
        
        if (command.position !== undefined) {
          updatedTabs.splice(command.position, 0, newTab);
        } else {
          updatedTabs.push(newTab);
        }
        
        onTabUpdate(updatedTabs);
        return {
          success: true,
          message: `✅ Tab "${command.title}" added successfully`,
          updatedTabs: updatedTabs.map(t => t.id)
        };
      }
      
      if (command.action === 'modify') {
        const tabIndex = updatedTabs.findIndex(tab => tab.id === command.tabId);
        if (tabIndex === -1) {
          return {
            success: false,
            message: `❌ Tab not found`,
            error: 'Tab ID not found'
          };
        }
        
        if (command.title) {
          updatedTabs[tabIndex].title = command.title;
        }
        if (command.content) {
          updatedTabs[tabIndex].content = command.content;
        }
        if (command.position !== undefined && command.position !== tabIndex) {
          const [tab] = updatedTabs.splice(tabIndex, 1);
          updatedTabs.splice(command.position, 0, tab);
        }
        
        onTabUpdate(updatedTabs);
        return {
          success: true,
          message: `✅ Tab "${updatedTabs[tabIndex].title}" modified successfully`,
          updatedTabs: updatedTabs.map(t => t.id)
        };
      }
      
      if (command.action === 'delete') {
        const tabIndex = updatedTabs.findIndex(tab => tab.id === command.tabId);
        if (tabIndex === -1) {
          return {
            success: false,
            message: `❌ Tab not found`,
            error: 'Tab ID not found'
          };
        }
        
        if (!command.confirmation) {
          return {
            success: false,
            message: `⚠️ Please confirm deletion by adding "confirm" or "yes" to your command`,
            error: 'Deletion not confirmed'
          };
        }
        
        const deletedTab = updatedTabs[tabIndex];
        updatedTabs.splice(tabIndex, 1);
        onTabUpdate(updatedTabs);
        
        return {
          success: true,
          message: `🗑️ Tab "${deletedTab.title}" deleted successfully`,
          updatedTabs: updatedTabs.map(t => t.id)
        };
      }
      
      return {
        success: false,
        message: `❌ Unknown command action`,
        error: 'Invalid command action'
      };
      
    } catch (error) {
      return {
        success: false,
        message: `❌ Error executing command`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get help text for tab management commands
   */
  getHelpText(): string {
    return `
🎯 **Tab Management Commands**

**Add a new tab:**
• "add tab [title]"
• "create tab [title] with content [content]"
• "new tab [title] at position [number]"

**Modify existing tab:**
• "modify tab [id] to [new title]"
• "edit tab [id] content to [new content]"
• "change tab [id] position to [number]"

**Delete a tab:**
• "delete tab [id] confirm"
• "remove tab [id] yes"

**Examples:**
• "add tab Game Progress"
• "modify tab tab_123 to Current Objectives"
• "delete tab tab_456 confirm"
• "move tab tab_789 to position 2"

💡 **Tips:**
• Use "confirm" or "yes" for deletions
• Tab IDs are shown in the URL or tab context menu
• Position 0 is the first tab, 1 is second, etc.
    `.trim();
  }

  private extractTitle(text: string): string | null {
    // Extract title after keywords
    const patterns = [
      /(?:add|create|new)\s+tab\s+(.+?)(?:\s+with|\s+at|\s*$)/i,
      /(?:modify|edit|change)\s+tab\s+\w+\s+(?:to|with)\s+(.+?)(?:\s+with|\s+at|\s*$)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private extractContent(text: string): string | null {
    const match = text.match(/with\s+content\s+(.+?)(?:\s+at|\s*$)/i);
    return match ? match[1].trim() : null;
  }

  private extractTabId(text: string): string | null {
    // Look for tab_123 pattern
    const match = text.match(/tab_(\d+)/i);
    return match ? match[0] : null;
  }

  private extractPosition(text: string): number | null {
    const match = text.match(/position\s+(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }
}

export default TabManagementService.getInstance();
