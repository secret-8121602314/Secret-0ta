#!/usr/bin/env node

/**
 * Clear First Run Experience Cache Script
 * This script clears all localStorage keys related to first run experience
 * to force a fresh onboarding flow for testing
 */

console.log('🧹 Clearing First Run Experience Cache...');

// List of localStorage keys to clear for first run experience
const keysToClear = [
  // Onboarding and first run
  'otakonOnboardingComplete',
  'otakon_profile_setup_completed',
  'otakon_first_run_completed',
  'otakon_welcome_message_shown',
  'otakon_first_welcome_shown',
  'otakon_has_conversations',
  'otakon_has_interacted_with_chat',
  'otakon_last_welcome_time',
  'otakon_app_closed_time',
  
  // Tutorial and UI
  'otakon_tutorial_completed',
  'otakon_tutorial_step',
  'otakon_tutorial_shown',
  
  // Auth and connection
  'otakonAuthMethod',
  'otakonHasConnectedBefore',
  
  // PWA and install
  'otakonGlobalPWAInstalled',
  'otakonInstallDismissed',
  
  // Screenshot and features
  'otakon_screenshot_mode',
  'otakon_screenshot_hint_seen',
  
  // Voice and hands-free
  'otakonPreferredVoiceURI',
  'otakonSpeechRate',
  
  // Suggested prompts
  'lastSuggestedPromptsShown',
  'otakon_used_suggested_prompts',
  
  // Legacy keys
  'otakonConversations',
  'otakonUsage'
];

// Function to clear localStorage (for browser context)
function clearLocalStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    let clearedCount = 0;
    
    keysToClear.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
        clearedCount++;
      }
    });
    
    console.log(`\n🎉 Successfully cleared ${clearedCount} localStorage keys!`);
    console.log('🔄 First run experience cache has been reset.');
    console.log('📱 Refresh the app to see the fresh onboarding flow.');
  } else {
    console.log('❌ localStorage not available in this context');
  }
}

// Function to clear service worker cache
async function clearServiceWorkerCache() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Unregistered service worker');
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        console.log('✅ Cleared all service worker caches');
      }
    } catch (error) {
      console.log('⚠️ Could not clear service worker cache:', error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting cache clearing process...\n');
  
  // Clear localStorage
  clearLocalStorage();
  
  // Clear service worker cache
  await clearServiceWorkerCache();
  
  console.log('\n✨ Cache clearing complete!');
  console.log('🔄 Please refresh your browser/app to see the changes.');
}

// Run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser context - run immediately
  main();
} else {
  // Node.js context - export for use
  module.exports = { clearLocalStorage, clearServiceWorkerCache, keysToClear };
  console.log('📝 Script loaded. Run in browser context to clear cache.');
}
