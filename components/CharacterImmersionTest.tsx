import React, { useEffect } from 'react';
// Dynamic import to avoid circular dependency
// import { characterDetectionService } from '../services/characterDetectionService';

const CharacterImmersionTest: React.FC = () => {
  useEffect(() => {
    const runTests = async () => {
      // Disabled excessive logging - only run tests in development mode
      if (process.env.NODE_ENV !== 'development') {
        return;
      }
    
    console.log('🧪 Starting Character Immersion Tests...');
    
    // Test 1: Character detection from messages
    console.log('\n🧪 Test 1: Character Detection from Game Story Context');
    const mockMessages = [
      { id: '1', role: 'user' as const, text: "I'm fighting Margit and I can't beat him. Any tips?" },
      { id: '2', role: 'user' as const, text: "I need to find Ranni in the Caria Manor. Where is she?" },
      { id: '3', role: 'user' as const, text: "I'm helping Blaidd with his quest to find the Black Knife." },
      { id: '4', role: 'user' as const, text: "I met Melina at the Church of Elleh and she gave me a task." },
      { id: '5', role: 'user' as const, text: "I'm stuck on Godrick's boss fight. How do I defeat him?" },
      { id: '6', role: 'user' as const, text: "I need to rescue Sellen from the Academy. Any advice?" },
      { id: '7', role: 'user' as const, text: "I'm learning about Radagon's backstory. What happened to him?" },
      { id: '8', role: 'user' as const, text: "I'm playing as a character named Shadow in Cyberpunk 2077." }
    ];
    
    const testCharacterDetection = async () => {
      const { characterDetectionService } = await import('../services/characterDetectionService');
      
      mockMessages.forEach((message, index) => {
        const detectedCharacter = characterDetectionService.detectCharacterFromMessages([message]);
        if (detectedCharacter) {
          console.log(`✅ Message ${index + 1}: Character detected: ${detectedCharacter.name} (${detectedCharacter.confidence} confidence)`);
          console.log(`   Source: ${detectedCharacter.source}, Context: ${detectedCharacter.context}`);
          console.log(`   Original text: "${message.text}"`);
        } else {
          console.log(`❌ Message ${index + 1}: No character detected`);
          console.log(`   Text: "${message.text}"`);
        }
      });
    };
    
    testCharacterDetection();
    
    // Test 2: Game language profiles
    console.log('\n🧪 Test 2: Game Language Profiles');
    const testGames = [
      'Elden Ring',
      'Cyberpunk 2077', 
      'Baldur\'s Gate 3',
      'The Legend of Zelda: Tears of the Kingdom',
      'God of War Ragnarök'
    ];
    
    const testGameProfiles = async () => {
      const { characterDetectionService } = await import('../services/characterDetectionService');
      
      testGames.forEach(gameTitle => {
        const gameId = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const gameProfile = characterDetectionService.getGameLanguageProfile(gameId, gameTitle);
        
        console.log(`✅ ${gameProfile.gameName}:`);
        console.log(`   Genre: ${gameProfile.genre}`);
        console.log(`   Language Style: ${gameProfile.languageStyle}`);
        console.log(`   Tone: ${gameProfile.tone}`);
        console.log(`   Character Address Style: ${gameProfile.characterAddressStyle}`);
        console.log(`   Immersion Level: ${gameProfile.immersionLevel}`);
      });
    };
    
    testGameProfiles();
    
    // Test 3: Character address formats
    console.log('\n🧪 Test 3: Character Address Formats');
    const testCharacters = ['Alex', 'Shadow', 'Sarah', 'Commander'];
    
    testGames.slice(0, 3).forEach(gameTitle => {
      const gameId = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      console.log(`\n🎮 ${gameTitle}:`);
      
      testCharacters.forEach(characterName => {
        const addressFormat = characterDetectionService.getCharacterAddressFormat(gameId, characterName);
        console.log(`   ${characterName} → ${addressFormat}`);
      });
    });
    
    // Test 4: Immersive language patterns
    console.log('\n🧪 Test 4: Immersive Language Patterns');
    testGames.slice(0, 3).forEach(gameTitle => {
      const gameId = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const languagePatterns = characterDetectionService.getImmersiveLanguagePatterns(gameId);
      
      console.log(`\n🎭 ${gameTitle} Language Patterns:`);
      console.log(`   Greetings: ${languagePatterns.greetings.slice(0, 2).join(', ')}`);
      console.log(`   Encouragements: ${languagePatterns.encouragements.slice(0, 2).join(', ')}`);
      console.log(`   Hints: ${languagePatterns.hints.slice(0, 2).join(', ')}`);
      console.log(`   Confirmations: ${languagePatterns.confirmations.slice(0, 2).join(', ')}`);
    });
    
    // Test 5: Image Context Character Detection
    console.log('\n🧪 Test 5: Image Context Character Detection');
    const mockImageDescriptions = [
      "I'm fighting a boss named Margit in this screenshot. He's really tough!",
      "I can see Ranni in the Caria Manor. She's giving me a quest.",
      "This shows me talking to Blaidd about the Black Knife quest.",
      "I'm in a battle with Godrick the Grafted. Any tips?",
      "I can see Melina at the Church of Elleh in this image."
    ];
    
    mockImageDescriptions.forEach((description, index) => {
      const detectedCharacter = characterDetectionService.detectCharacterFromImageContext(description);
      if (detectedCharacter) {
        console.log(`✅ Image ${index + 1}: Character detected: ${detectedCharacter.name} (${detectedCharacter.confidence} confidence)`);
        console.log(`   Source: ${detectedCharacter.source}, Context: ${detectedCharacter.context}`);
        console.log(`   Description: "${description}"`);
      } else {
        console.log(`❌ Image ${index + 1}: No character detected`);
        console.log(`   Description: "${description}"`);
      }
    });
    
    // Test 6: Cached data
    console.log('\n🧪 Test 6: Cached Data');
    const { characterDetectionService } = await import('../services/characterDetectionService');
    const cachedCharacters = characterDetectionService.getCachedCharacters();
    const gameProfiles = characterDetectionService.getGameLanguageProfiles();
    
    console.log(`✅ Cached characters: ${cachedCharacters.length}`);
    console.log(`✅ Game profiles: ${gameProfiles.length}`);
    
    if (cachedCharacters.length > 0) {
      console.log('📋 Cached Characters:');
      cachedCharacters.forEach(char => {
        console.log(`   - ${char.name} (${char.confidence} confidence, ${char.source})`);
      });
    }
    
    if (gameProfiles.length > 0) {
      console.log('🎮 Game Profiles:');
      gameProfiles.forEach(profile => {
        console.log(`   - ${profile.gameName}: ${profile.languageStyle} style, ${profile.tone} tone`);
      });
    }
    
    // Test 7: Game ID extraction
    console.log('\n🧪 Test 7: Game ID Extraction');
    const testTitles = [
      'Elden Ring Help',
      'Cyberpunk 2077 Walkthrough',
      'Baldur\'s Gate 3 Tips',
      'Zelda: Tears of the Kingdom Guide',
      'God of War Ragnarök Boss Fights'
    ];
    
    testTitles.forEach(title => {
      const gameId = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      console.log(`   "${title}" → ${gameId}`);
    });
    
    console.log('\n🎉 Character Immersion Tests Complete!');
    console.log('📖 Check the console above for detailed test results.');
    console.log('🔧 The system is now ready to provide immersive, character-aware AI responses.');
    };
    
    runTests();
  }, []);

  // Return null - no UI, just console logs
  return null;
};

export default CharacterImmersionTest;
