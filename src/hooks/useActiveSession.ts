import { useState, useCallback, useEffect } from 'react';

export interface ActiveSessionState {
  isActive: boolean;
  currentGameId?: string; // Corresponds to conversation.id
}

const STORAGE_KEY = 'otakon_active_session_state';

// Load persisted session state from localStorage
const loadPersistedState = (): ActiveSessionState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ActiveSessionState;
    }
  } catch (error) {
    console.error('[useActiveSession] Failed to load persisted state:', error);
  }
  return null;
};

// Save session state to localStorage
const persistState = (state: ActiveSessionState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[useActiveSession] Failed to persist state:', error);
  }
};

export const useActiveSession = (initialState: ActiveSessionState = { isActive: true }) => {
  // Initialize with persisted state if available, otherwise use provided initialState
  const [session, setSession] = useState<ActiveSessionState>(() => {
    const persisted = loadPersistedState();
    return persisted || initialState;
  });

  // Persist state whenever it changes
  useEffect(() => {
    persistState(session);
  }, [session]);

  const toggleSession = useCallback((conversationId: string) => {
    setSession(prevSession => {
      // If toggling off, or switching to a new game's session
      if (prevSession.isActive && prevSession.currentGameId === conversationId) {
        return { isActive: false };
      } else {
        return { isActive: true, currentGameId: conversationId };
      }
    });
  }, []);

  const setActiveSession = useCallback((conversationId: string, isActive: boolean) => {
    setSession({
      isActive,
      currentGameId: isActive ? conversationId : undefined
    });
  }, []);

  return { 
    session, 
    toggleSession, 
    setActiveSession 
  };
};
