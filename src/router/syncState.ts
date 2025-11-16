import type { AppView, OnboardingStatus } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Database sync helper for React Router mode
 * Derives navigation state from router location and syncs to database
 */

/**
 * Derive AppView from current pathname
 */
export function deriveAppViewFromPath(pathname: string): AppView {
  // Path is already clean for custom domain
  const cleanPath = pathname;
  
  if (cleanPath === '/' || cleanPath === '') {
    return 'landing';
  }
  
  // Any authenticated route is 'app' view
  if (cleanPath.startsWith('/login') || 
      cleanPath.startsWith('/onboarding') || 
      cleanPath.startsWith('/app')) {
    return 'app';
  }
  
  return 'landing';
}

/**
 * Derive OnboardingStatus from current pathname
 */
export function deriveOnboardingStatusFromPath(pathname: string): OnboardingStatus {
  // Remove base path if present
  const cleanPath = pathname.replace(/^\/Otagon/, '');
  
  // Map paths to onboarding status
  if (cleanPath === '/login') {
    return 'login';
  }
  
  if (cleanPath === '/onboarding/initial') {
    return 'initial';
  }
  
  if (cleanPath === '/onboarding/how-to-use') {
    return 'how-to-use';
  }
  
  if (cleanPath === '/onboarding/features-connected') {
    return 'features-connected';
  }
  
  if (cleanPath === '/onboarding/pro-features') {
    return 'pro-features';
  }
  
  if (cleanPath.startsWith('/app')) {
    return 'complete';
  }
  
  // Default to login for authenticated routes
  return 'login';
}

/**
 * Sync router-derived state to database app_state column
 * Preserves existing app_state fields while updating navigation fields
 */
export async function syncRouterStateToDatabase(
  userId: string,
  pathname: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const view = deriveAppViewFromPath(pathname);
    const onboardingStatus = deriveOnboardingStatusFromPath(pathname);
    
    // Fetch current app_state to preserve other fields
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('app_state')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('[syncRouterStateToDatabase] Error fetching app_state:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Merge router state with existing app_state
    const currentAppState = (userData?.app_state || {}) as import('../types/enhanced').UserAppState;
    const updatedAppState = {
      ...currentAppState,
      view,
      onboardingStatus,
      // Preserve these fields from existing state
      showUpgradeScreen: currentAppState.showUpgradeScreen || false,
      isHandsFreeMode: currentAppState.isHandsFreeMode || false,
      activeModal: currentAppState.activeModal || null,
      activeConversationId: currentAppState.activeConversationId || null,
    };
    
    // Update database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        app_state: JSON.parse(JSON.stringify(updatedAppState)), // Ensure plain JSON
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('[syncRouterStateToDatabase] Error updating app_state:', updateError);
      return { success: false, error: updateError.message };
    }
    
        return { success: true };
    
  } catch (error) {
    console.error('[syncRouterStateToDatabase] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Hook to sync router state to database on route changes
 * Use this in route components that need database sync
 */
export function useSyncRouterState(userId: string | null) {
  const pathname = window.location.pathname;
  
  React.useEffect(() => {
    if (!userId) {
      return;
    }
    
    // Sync on mount and path changes
    syncRouterStateToDatabase(userId, pathname);
  }, [userId, pathname]);
}

// Add React import for the hook
import React from 'react';
