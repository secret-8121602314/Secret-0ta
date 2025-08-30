class SuggestedPromptsService {
  private readonly STORAGE_KEY = 'otakon_used_suggested_prompts';
  private usedPrompts: Set<string> = new Set();

  constructor() {
    this.loadUsedPrompts();
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
   * Mark a prompt as used
   */
  markPromptAsUsed(prompt: string): void {
    this.usedPrompts.add(prompt);
    this.saveUsedPrompts();
  }

  /**
   * Check if a prompt has been used
   */
  isPromptUsed(prompt: string): boolean {
    return this.usedPrompts.has(prompt);
  }

  /**
   * Get all unused prompts from a list
   */
  getUnusedPrompts(prompts: string[]): string[] {
    return prompts.filter(prompt => !this.isPromptUsed(prompt));
  }

  /**
   * Check if all prompts have been used
   */
  areAllPromptsUsed(prompts: string[]): boolean {
    return prompts.every(prompt => this.isPromptUsed(prompt));
  }

  /**
   * Reset used prompts (called on app restart or login)
   */
  resetUsedPrompts(): void {
    this.usedPrompts.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get count of used prompts
   */
  getUsedCount(): number {
    return this.usedPrompts.size;
  }

  /**
   * Get count of total prompts
   */
  getTotalCount(prompts: string[]): number {
    return prompts.length;
  }
}

export const suggestedPromptsService = new SuggestedPromptsService();
