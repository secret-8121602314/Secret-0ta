export interface DailyGoal {
  id: string;
  type: 'screenshots' | 'help_others' | 'new_games' | 'insights';
  target: number;
  current: number;
  title: string;
  description: string;
  completed: boolean;
  reward: string;
}

export interface UserStreak {
  type: string;
  count: number;
  lastAchieved: string;
  nextMilestone: number;
  dailyLogin: number;
  gameDays: number;
  insightDays: number;
  lastLoginDate: string;
  lastGameDate: string;
  lastInsightDate: string;
}

import { supabase } from './supabase';
import { Achievement } from './types';

export class DailyEngagementService {
  private static instance: DailyEngagementService;
  
  private constructor() {}
  
  static getInstance(): DailyEngagementService {
    if (!DailyEngagementService.instance) {
      DailyEngagementService.instance = new DailyEngagementService();
    }
    return DailyEngagementService.instance;
  }

  /**
   * Get daily goals for the current user
   */
  getDailyGoals(): DailyGoal[] {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`dailyGoals_${today}`);
    
    if (stored) {
      return JSON.parse(stored);
    }

    // Generate new daily goals
    const goals: DailyGoal[] = [
      {
        id: 'screenshots',
        type: 'screenshots',
        target: 20,
        current: 0,
        title: 'Screenshot Master',
        description: 'Analyze screenshots to help your gaming',
        completed: false,
        reward: '+50 Otagon Points'
      },
      {
        id: 'help_others',
        type: 'help_others',
        target: 5,
        current: 0,
        title: 'Community Helper',
        description: 'Help other players with their questions',
        completed: false,
        reward: '+30 Otagon Points'
      },
      {
        id: 'new_games',
        type: 'new_games',
        target: 3,
        current: 0,
        title: 'Game Explorer',
        description: 'Try analyzing different games',
        completed: false,
        reward: '+40 Otagon Points'
      },
      {
        id: 'insights',
        type: 'insights',
        target: 10,
        current: 0,
        title: 'Insight Creator',
        description: 'Create new insights for your games',
        completed: false,
        reward: '+25 Otagon Points'
      }
    ];

    localStorage.setItem(`dailyGoals_${today}`, JSON.stringify(goals));
    return goals;
  }

  /**
   * Update progress for a specific goal
   */
  updateGoalProgress(type: string, increment: number = 1): void {
    const goals = this.getDailyGoals();
    const goal = goals.find(g => g.type === type);
    
    if (goal) {
      goal.current = Math.min(goal.current + increment, goal.target);
      const today = new Date().toDateString();
      localStorage.setItem(`dailyGoals_${today}`, JSON.stringify(goals));
    }
  }

  /**
   * Get user streaks
   */
  getUserStreaks(): UserStreak {
    const stored = localStorage.getItem('userStreaks');
    
    if (stored) {
      return JSON.parse(stored);
    }

    const defaultStreaks: UserStreak = {
      type: 'daily_login',
      count: 0,
      lastAchieved: '',
      nextMilestone: 7,
      dailyLogin: 0,
      gameDays: 0,
      insightDays: 0,
      lastLoginDate: '',
      lastGameDate: '',
      lastInsightDate: ''
    };

    localStorage.setItem('userStreaks', JSON.stringify(defaultStreaks));
    return defaultStreaks;
  }

  /**
   * Update login streak
   */
  updateLoginStreak(): void {
    const streaks = this.getUserStreaks();
    const today = new Date().toDateString();
    
    if (streaks.lastLoginDate !== today) {
      if (this.isConsecutiveDay(streaks.lastLoginDate)) {
        streaks.dailyLogin++;
      } else {
        streaks.dailyLogin = 1;
      }
      streaks.lastLoginDate = today;
      
      localStorage.setItem('userStreaks', JSON.stringify(streaks));
    }
  }

  /**
   * Update game session streak
   */
  updateGameStreak(): void {
    const streaks = this.getUserStreaks();
    const today = new Date().toDateString();
    
    if (streaks.lastGameDate !== today) {
      if (this.isConsecutiveDay(streaks.lastGameDate)) {
        streaks.gameDays++;
      } else {
        streaks.gameDays = 1;
      }
      streaks.lastGameDate = today;
      
      localStorage.setItem('userStreaks', JSON.stringify(streaks));
    }
  }

  /**
   * Update insight creation streak
   */
  updateInsightStreak(): void {
    const streaks = this.getUserStreaks();
    const today = new Date().toDateString();
    
    if (streaks.lastInsightDate !== today) {
      if (this.isConsecutiveDay(streaks.lastInsightDate)) {
        streaks.insightDays++;
      } else {
        streaks.insightDays = 1;
      }
      streaks.lastInsightDate = today;
      
      localStorage.setItem('userStreaks', JSON.stringify(streaks));
    }
  }

  /**
   * Check if a date is consecutive to today
   */
  private isConsecutiveDay(lastDate: string): boolean {
    if (!lastDate) return false;
    
    const last = new Date(lastDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }



  /**
   * Get weekly progress summary
   */
  getWeeklySummary(): {
    gamesPlayed: number;
    screenshotsAnalyzed: number;
    insightsCreated: number;
    achievements: number;
    streak: number;
  } {
    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let gamesPlayed = 0;
    let screenshotsAnalyzed = 0;
    let insightsCreated = 0;
    let achievements = 0;
    
    // Count from localStorage (simplified for now)
    // Session progress tracking removed
    
    const streaks = this.getUserStreaks();
    
    return {
      gamesPlayed,
      screenshotsAnalyzed: Math.floor(Math.random() * 50) + 20, // Mock data
      insightsCreated: Math.floor(Math.random() * 20) + 5, // Mock data
      achievements: Math.floor(Math.random() * 5) + 1, // Mock data
      streak: streaks.dailyLogin
    };
  }

  /**
   * Check if user should see daily check-in
   */
  shouldShowDailyCheckin(): boolean {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(`dailyCheckin_${today}`);
    return !lastShown;
  }

  /**
   * Mark daily check-in as shown
   */
  markDailyCheckinShown(): void {
    const today = new Date().toDateString();
    localStorage.setItem(`dailyCheckin_${today}`, 'true');
  }



  /**
   * Update last session time
   */
  updateLastSessionTime(): void {
    localStorage.setItem('lastSessionTime', new Date().toISOString());
  }
}

export default DailyEngagementService.getInstance();
