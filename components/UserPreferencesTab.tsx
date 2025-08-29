import React, { useState, useEffect } from 'react';
import { 
  UserPreferences, 
  GameGenre, 
  HintStyle, 
  DetailLevel, 
  SpoilerSensitivity, 
  AIPersonality, 
  ResponseFormat, 
  SkillLevel,
  userPreferencesService 
} from '../services/userPreferencesService';

interface UserPreferencesTabProps {
  onPreferencesUpdated?: () => void;
}

const UserPreferencesTab: React.FC<UserPreferencesTabProps> = ({ onPreferencesUpdated }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const prefs = await userPreferencesService.getPreferences();
      
      if (prefs) {
        setPreferences(prefs);
      } else {
        // If no preferences returned, use defaults
        const defaultPrefs = userPreferencesService.getDefaultPreferencesForDisplay();
        setPreferences({
          user_id: 'default',
          ...defaultPrefs
        });
        setError(null); // Database fallback is expected in development
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Use default preferences as fallback
      const defaultPrefs = userPreferencesService.getDefaultPreferencesForDisplay();
      setPreferences({
        user_id: 'default',
        ...defaultPrefs
      });
      setError('Failed to load preferences. Using defaults.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      setSaveMessage('');
      
      const success = await userPreferencesService.updatePreferences(preferences);
      
      if (success) {
        setSaveMessage('Preferences saved successfully!');
        setError(null); // Clear any previous errors
        onPreferencesUpdated?.();
        
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Error saving preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateGamingPattern = <K extends keyof UserPreferences['gaming_patterns']>(
    key: K, 
    value: UserPreferences['gaming_patterns'][K]
  ) => {
    if (!preferences) return;
    setPreferences(prev => prev ? {
      ...prev,
      gaming_patterns: {
        ...prev.gaming_patterns,
        [key]: value
      }
    } : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53A3A]"></div>
        <span className="ml-3 text-neutral-400">Loading preferences...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Preferences Not Available</h3>
          <p className="text-neutral-400 mb-4">
            We're unable to load your preferences at the moment. This might be due to:
          </p>
          <ul className="text-sm text-neutral-500 space-y-1 mb-4">
            <li>• Database connection issues</li>
            <li>• Missing database tables</li>
            <li>• Authentication problems</li>
          </ul>
        </div>
        <button
          onClick={loadPreferences}
          className="bg-[#E53A3A] hover:bg-[#D42A2A] text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Error Notice - Only show real errors, not fallback status */}
      {error && !error.includes('default preferences') && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-300 font-medium">Error</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Personalization</h2>
        <p className="text-neutral-400">Customize how Otakon AI interacts with you based on your gaming preferences.</p>
      </div>

      {/* Game Genre & Skill Level */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">Game Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Favorite Game Genre</label>
            <select
              value={preferences.game_genre}
              onChange={(e) => updatePreference('game_genre', e.target.value as GameGenre)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="rpg">RPG</option>
              <option value="fps">FPS</option>
              <option value="strategy">Strategy</option>
              <option value="adventure">Adventure</option>
              <option value="puzzle">Puzzle</option>
              <option value="simulation">Simulation</option>
              <option value="sports">Sports</option>
              <option value="racing">Racing</option>
              <option value="fighting">Fighting</option>
              <option value="mmo">MMO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Skill Level</label>
            <select
              value={preferences.skill_level}
              onChange={(e) => updatePreference('skill_level', e.target.value as SkillLevel)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="beginner">Beginner</option>
              <option value="casual">Casual</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Interaction Preferences */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">AI Interaction Style</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Hint Style</label>
            <select
              value={preferences.hint_style}
              onChange={(e) => updatePreference('hint_style', e.target.value as HintStyle)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="direct">Direct</option>
              <option value="subtle">Subtle</option>
              <option value="progressive">Progressive</option>
              <option value="socratic">Socratic</option>
              <option value="story-based">Story-based</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Detail Level</label>
            <select
              value={preferences.detail_level}
              onChange={(e) => updatePreference('detail_level', e.target.value as DetailLevel)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="minimal">Minimal</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Spoiler Sensitivity</label>
            <select
              value={preferences.spoiler_sensitivity}
              onChange={(e) => updatePreference('spoiler_sensitivity', e.target.value as SpoilerSensitivity)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="very_sensitive">Very Sensitive</option>
              <option value="sensitive">Sensitive</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">AI Personality</label>
            <select
              value={preferences.ai_personality}
              onChange={(e) => updatePreference('ai_personality', e.target.value as AIPersonality)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="humorous">Humorous</option>
              <option value="mysterious">Mysterious</option>
              <option value="encouraging">Encouraging</option>
              <option value="analytical">Analytical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Response Format */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">Response Format</h3>
        
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Preferred Response Format</label>
          <select
            value={preferences.preferred_response_format}
            onChange={(e) => updatePreference('preferred_response_format', e.target.value as ResponseFormat)}
            className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
          >
            <option value="text_only">Text Only</option>
            <option value="text_with_bullets">Text with Bullets</option>
            <option value="step_by_step">Step by Step</option>
            <option value="story_narrative">Story Narrative</option>
            <option value="technical">Technical</option>
          </select>
        </div>
      </div>

      {/* Gaming Patterns */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white border-b border-neutral-700 pb-2">Gaming Patterns</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Session Duration</label>
            <select
              value={preferences.gaming_patterns.session_duration}
              onChange={(e) => updateGamingPattern('session_duration', e.target.value)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="short">Short (30 min)</option>
              <option value="medium">Medium (1-2 hours)</option>
              <option value="long">Long (3+ hours)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Play Frequency</label>
            <select
              value={preferences.gaming_patterns.frequency}
              onChange={(e) => updateGamingPattern('frequency', e.target.value)}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E53A3A]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="occasional">Occasional</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="multiplayer"
              checked={preferences.gaming_patterns.multiplayer_preference}
              onChange={(e) => updateGamingPattern('multiplayer_preference', e.target.checked)}
              className="w-4 h-4 text-[#E53A3A] bg-[#2E2E2E] border-[#424242] rounded focus:ring-[#E53A3A] focus:ring-2"
            />
            <label htmlFor="multiplayer" className="text-sm text-neutral-300">
              Prefer multiplayer games
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="completionist"
              checked={preferences.gaming_patterns.completionist_tendency}
              onChange={(e) => updateGamingPattern('completionist_tendency', e.target.checked)}
              className="w-4 h-4 text-[#E53A3A] bg-[#2E2E2E] border-[#424242] rounded focus:ring-[#E53A3A] focus:ring-2"
            />
            <label htmlFor="completionist" className="text-sm text-neutral-300">
              Tend to complete everything in games
            </label>
          </div>
        </div>
      </div>

      {/* Save Button & Message */}
      <div className="pt-6 border-t border-neutral-700">
        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Preferences'
            )}
          </button>
          
          {saveMessage && (
            <div className={`text-sm ${saveMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </div>
          )}
        </div>
        
        <p className="text-xs text-neutral-500 mt-3">
          These preferences help Otakon AI provide personalized assistance tailored to your gaming style and preferences.
        </p>
      </div>
    </div>
  );
};

export default UserPreferencesTab;
