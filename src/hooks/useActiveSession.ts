import { useState, useCallback } from 'react';

export interface ActiveSessionState {
  isActive: boolean;
  currentGameId?: string; // Corresponds to conversation.id
}

export const useActiveSession = (initialState: ActiveSessionState = { isActive: false }) => {
  const [session, setSession] = useState<ActiveSessionState>(initialState);

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
