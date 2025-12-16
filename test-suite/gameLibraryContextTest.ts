/**
 * Test: Game Library Context Injection
 * 
 * This test verifies that the AI receives context about all user's game tabs
 */

import { buildGameLibraryContext } from '../src/services/promptSystem';
import { ConversationService } from '../src/services/conversationService';

/**
 * Manual Test Instructions:
 * 
 * 1. Create several game tabs (e.g., Elden Ring, Cyberpunk 2077, Hades)
 * 2. Set progress on some games (use Command Centre or natural gameplay)
 * 3. Open browser console (F12)
 * 4. Run this test to see what context AI receives
 * 
 * Expected Output:
 * - List of all game tabs with titles
 * - Genre information for each game
 * - Progress percentages where available
 * - Usage instructions for AI
 */

async function testGameLibraryContext() {
  console.group('🧪 Testing Game Library Context Injection');
  
  try {
    // Get all conversations
    const conversations = await ConversationService.getConversations();
    console.log('📚 Total Conversations:', Object.keys(conversations).length);
    
    // Filter game tabs
    const gameTabs = Object.values(conversations)
      .filter(conv => !conv.isGameHub && conv.gameTitle);
    
    console.log('🎮 Game Tabs Found:', gameTabs.length);
    console.table(gameTabs.map(game => ({
      Title: game.gameTitle,
      Genre: game.genre || 'Unknown',
      Progress: `${game.gameProgress || 0}%`,
      Unreleased: game.isUnreleased ? 'Yes' : 'No',
      Messages: game.messages.length
    })));
    
    // Build the actual context that AI receives
    console.log('\n📋 Context Sent to AI:\n');
    // Note: Can't directly call buildGameLibraryContext as it's not exported
    // This shows the data it would use
    
    if (gameTabs.length === 0) {
      console.log('No game tabs created yet. User is new or exploring games.');
    } else {
      gameTabs.forEach(game => {
        const progressStr = game.gameProgress > 0 ? ` (${game.gameProgress}% progress)` : '';
        const statusStr = game.isUnreleased ? ' [UNRELEASED]' : '';
        console.log(`  • ${game.gameTitle} [${game.genre || 'Unknown'}]${progressStr}${statusStr}`);
      });
    }
    
    console.log('\n✅ Test Complete');
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Test Scenarios to Verify:
 */

async function testScenarios() {
  console.group('🎯 Test Scenarios');
  
  const scenarios = [
    {
      name: 'Duplicate Tab Prevention',
      userQuery: 'Help me with Elden Ring',
      expectedBehavior: 'AI should detect existing Elden Ring tab and route there'
    },
    {
      name: 'Game Recommendations',
      userQuery: 'What should I play next?',
      expectedBehavior: 'AI should reference games in library and suggest new ones'
    },
    {
      name: 'Cross-Tab Routing',
      currentTab: 'Elden Ring',
      userQuery: 'What\'s in Jig Jig Street?',
      expectedBehavior: 'AI detects Cyberpunk 2077, checks library, routes to existing tab'
    },
    {
      name: 'Genre Analysis',
      userQuery: 'What type of games do I play?',
      expectedBehavior: 'AI analyzes library and identifies user preferences'
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.group(`Scenario ${index + 1}: ${scenario.name}`);
    console.log('User Query:', scenario.userQuery);
    if (scenario.currentTab) console.log('Current Tab:', scenario.currentTab);
    console.log('Expected:', scenario.expectedBehavior);
    console.groupEnd();
  });
  
  console.groupEnd();
}

// Export for manual testing in browser console
(window as any).testGameLibraryContext = testGameLibraryContext;
(window as any).testScenarios = testScenarios;

console.log('📝 Run testGameLibraryContext() in console to test');
console.log('📝 Run testScenarios() to see expected behaviors');
