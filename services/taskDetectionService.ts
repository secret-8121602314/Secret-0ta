export interface DetectedTask {
  title: string;
  description: string;
  category: 'quest' | 'boss' | 'exploration' | 'item' | 'character' | 'custom';
  confidence: number;
  source: string;
}

class TaskDetectionService {
  private static instance: TaskDetectionService;

  static getInstance(): TaskDetectionService {
    if (!TaskDetectionService.instance) {
      TaskDetectionService.instance = new TaskDetectionService();
    }
    return TaskDetectionService.instance;
  }

  // Detect actionable tasks from AI response text
  detectTasksFromText(text: string): DetectedTask[] {
    const tasks: DetectedTask[] = [];
    const lowerText = text.toLowerCase();

    // Quest patterns
    const questPatterns = [
      /(?:find|locate|retrieve|obtain|get|collect)\s+([^.!?]+(?:in|at|from|near|within)\s+[^.!?]+)/gi,
      /(?:complete|finish|fulfill)\s+([^.!?]+(?:quest|mission|task|objective))/gi,
      /(?:talk to|speak with|meet|visit)\s+([^.!?]+(?:about|regarding|concerning)\s+[^.!?]+)/gi
    ];

    // Boss/combat patterns
    const bossPatterns = [
      /(?:defeat|beat|overcome|fight|battle|challenge)\s+([^.!?]+(?:boss|enemy|opponent|adversary))/gi,
      /(?:how to|tips for|strategy to)\s+(?:defeat|beat|fight)\s+([^.!?]+)/gi
    ];

    // Exploration patterns
    const explorationPatterns = [
      /(?:explore|investigate|search|visit|go to|travel to)\s+([^.!?]+)/gi,
      /(?:check|examine|look at|inspect)\s+([^.!?]+)/gi
    ];

    // Item collection patterns
    const itemPatterns = [
      /(?:gather|collect|obtain|acquire|find|get)\s+([^.!?]+(?:items?|materials?|essences?|fragments?))/gi,
      /(?:craft|create|build|forge)\s+([^.!?]+(?:using|with|from)\s+[^.!?]+)/gi
    ];

    // Character interaction patterns
    const characterPatterns = [
      /(?:help|assist|aid|support)\s+([^.!?]+(?:with|regarding|about)\s+[^.!?]+)/gi,
      /(?:rescue|save|free|liberate)\s+([^.!?]+(?:from|in|at)\s+[^.!?]+)/gi
    ];

    // Process each pattern type
    this.processPatterns(questPatterns, lowerText, 'quest', tasks);
    this.processPatterns(bossPatterns, lowerText, 'boss', tasks);
    this.processPatterns(explorationPatterns, lowerText, 'exploration', tasks);
    this.processPatterns(itemPatterns, lowerText, 'item', tasks);
    this.processPatterns(characterPatterns, lowerText, 'character', tasks);

    // Remove duplicates and return
    return this.removeDuplicateTasks(tasks);
  }

  private processPatterns(patterns: RegExp[], text: string, category: DetectedTask['category'], tasks: DetectedTask[]): void {
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const taskText = match[1].trim();
          if (taskText.length > 5 && taskText.length < 100) { // Reasonable length
            tasks.push({
              title: this.capitalizeFirst(taskText),
              description: `Task detected from AI response: ${taskText}`,
              category,
              confidence: 0.8,
              source: text.substring(0, 100) + '...'
            });
          }
        }
      }
    });
  }

  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private removeDuplicateTasks(tasks: DetectedTask[]): DetectedTask[] {
    const seen = new Set<string>();
    return tasks.filter(task => {
      const key = task.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Enhanced detection for specific game contexts
  detectGameSpecificTasks(text: string, gameGenre?: string): DetectedTask[] {
    const baseTasks = this.detectTasksFromText(text);
    
    if (gameGenre === 'rpg' || gameGenre === 'action-rpg') {
      // Add RPG-specific patterns
      const rpgPatterns = [
        /(?:level up|increase|improve)\s+([^.!?]+(?:skill|ability|stat))/gi,
        /(?:unlock|discover|reveal)\s+([^.!?]+(?:secret|hidden|path))/gi
      ];
      
      rpgPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            baseTasks.push({
              title: this.capitalizeFirst(match[1].trim()),
              description: `RPG task detected: ${match[1].trim()}`,
              category: 'quest',
              confidence: 0.7,
              source: text.substring(0, 100) + '...'
            });
          }
        }
      });
    }

    return baseTasks;
  }
}

export const taskDetectionService = TaskDetectionService.getInstance();
