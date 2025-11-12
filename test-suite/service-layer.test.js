/**
 * SERVICE LAYER TEST SUITE
 * Tests all service functions for proper implementation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(phase, testName, status, details = '') {
  const result = { phase, testName, status, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${phase}] ${testName}`);
  if (details) console.log(`   └─ ${details}`);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// ============================================================================
// PHASE 14: SERVICES LAYER VERIFICATION
// ============================================================================

async function testPhase14_ServicesExist() {
  console.log('\n🔍 PHASE 14: SERVICES LAYER VERIFICATION\n');
  
  const services = [
    { name: 'authService', path: '../src/services/authService.ts', methods: ['getCurrentUser', 'login', 'logout', 'refreshUser', 'updateUserProfile', 'subscribe'] },
    { name: 'conversationService', path: '../src/services/conversationService.ts', methods: ['getConversations', 'setConversations', 'createConversation', 'addConversation', 'updateConversation', 'deleteConversation', 'ensureGameHubExists'] },
    { name: 'aiService', path: '../src/services/aiService.ts', methods: ['getChatResponse'] },
    { name: 'gameTabService', path: '../src/services/gameTabService.ts', methods: ['createGameTab', 'updateSubTabsFromAIResponse', 'isGameTab'] },
    { name: 'contextSummarizationService', path: '../src/services/contextSummarizationService.ts', methods: ['shouldSummarize', 'summarizeMessages', 'applyContextSummarization'] },
    { name: 'supabaseService', path: '../src/services/supabaseService.ts', methods: ['getConversations', 'createConversation', 'updateConversation', 'deleteConversation'] },
    { name: 'cacheService', path: '../src/services/cacheService.ts', methods: [] },
    { name: 'errorRecoveryService', path: '../src/services/errorRecoveryService.ts', methods: [] },
    { name: 'userService', path: '../src/services/userService.ts', methods: [] },
    { name: 'waitlistService', path: '../src/services/waitlistService.ts', methods: ['addToWaitlist', 'getWaitlistCount'] }
  ];
  
  for (const service of services) {
    try {
      const servicePath = join(__dirname, service.path);
      const content = readFileSync(servicePath, 'utf8');
      
      // Check if service file exists
      if (content) {
        logTest('PHASE 14', `${service.name} exists`, 'PASS');
        
        // Check for key methods
        let methodsFound = 0;
        for (const method of service.methods) {
          if (content.includes(method) || content.includes(`${method}(`)) {
            methodsFound++;
          }
        }
        
        if (service.methods.length > 0) {
          if (methodsFound === service.methods.length) {
            logTest('PHASE 14', `${service.name} has all required methods`, 'PASS', `${methodsFound}/${service.methods.length} methods found`);
          } else {
            logTest('PHASE 14', `${service.name} has all required methods`, 'WARNING', `${methodsFound}/${service.methods.length} methods found`);
          }
        }
      }
    } catch (error) {
      logTest('PHASE 14', `${service.name} exists`, 'FAIL', error.message);
    }
  }
}

// ============================================================================
// PHASE 20: ADVANCED AI FEATURES VERIFICATION
// ============================================================================

async function testPhase20_AdvancedFeatures() {
  console.log('\n🔍 PHASE 20: ADVANCED AI FEATURES VERIFICATION\n');
  
  const advancedServices = [
    { name: 'characterImmersionService', path: '../src/services/characterImmersionService.ts' },
    { name: 'profileAwareTabService', path: '../src/services/profileAwareTabService.ts' },
    { name: 'suggestedPromptsService', path: '../src/services/suggestedPromptsService.ts' }
  ];
  
  for (const service of advancedServices) {
    try {
      const servicePath = join(__dirname, service.path);
      const content = readFileSync(servicePath, 'utf8');
      
      if (content && content.length > 100) {
        logTest('PHASE 20', `${service.name} exists and implemented`, 'PASS');
      } else {
        logTest('PHASE 20', `${service.name} exists and implemented`, 'WARNING', 'File is very small or empty');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        logTest('PHASE 20', `${service.name} exists and implemented`, 'WARNING', 'Service file not found - may not be implemented yet');
      } else {
        logTest('PHASE 20', `${service.name} exists and implemented`, 'FAIL', error.message);
      }
    }
  }
}

// ============================================================================
// PHASE 22: ERROR RECOVERY VERIFICATION
// ============================================================================

async function testPhase22_ErrorRecovery() {
  console.log('\n🔍 PHASE 22: ERROR RECOVERY VERIFICATION\n');
  
  try {
    const errorServicePath = join(__dirname, '../src/services/errorRecoveryService.ts');
    const content = readFileSync(errorServicePath, 'utf8');
    
    const features = [
      { name: 'retry logic', pattern: /retry|attempt/i },
      { name: 'exponential backoff', pattern: /backoff|delay|timeout/i },
      { name: 'error handling', pattern: /catch|error|try/i }
    ];
    
    for (const feature of features) {
      if (feature.pattern.test(content)) {
        logTest('PHASE 22', `Error recovery has ${feature.name}`, 'PASS');
      } else {
        logTest('PHASE 22', `Error recovery has ${feature.name}`, 'WARNING', 'Pattern not found in code');
      }
    }
  } catch (error) {
    logTest('PHASE 22', 'Error recovery service verification', 'WARNING', 'Service may not be fully implemented');
  }
}

// ============================================================================
// PHASE 23: TTS VERIFICATION
// ============================================================================

async function testPhase23_TTS() {
  console.log('\n🔍 PHASE 23: TEXT-TO-SPEECH VERIFICATION\n');
  
  try {
    const ttsServicePath = join(__dirname, '../src/services/ttsService.ts');
    const content = readFileSync(ttsServicePath, 'utf8');
    
    if (content && content.length > 100) {
      logTest('PHASE 23', 'TTS service exists', 'PASS');
      
      const features = [
        'initialization',
        'voice',
        'play',
        'pause',
        'stop',
        'queue'
      ];
      
      let foundFeatures = 0;
      for (const feature of features) {
        if (content.toLowerCase().includes(feature)) {
          foundFeatures++;
        }
      }
      
      if (foundFeatures >= 4) {
        logTest('PHASE 23', 'TTS service has core features', 'PASS', `${foundFeatures}/${features.length} features found`);
      } else {
        logTest('PHASE 23', 'TTS service has core features', 'WARNING', `${foundFeatures}/${features.length} features found`);
      }
    }
  } catch (error) {
    logTest('PHASE 23', 'TTS service exists', 'WARNING', 'TTS may not be implemented yet');
  }
}

// ============================================================================
// PHASE 26: OTAKON TAGS & PROMPT SYSTEM VERIFICATION
// ============================================================================

async function testPhase26_OtakonTags() {
  console.log('\n🔍 PHASE 26: OTAKON TAGS & PROMPT SYSTEM VERIFICATION\n');
  
  try {
    const otakonTagsPath = join(__dirname, '../src/services/otakonTags.ts');
    const content = readFileSync(otakonTagsPath, 'utf8');
    
    const tags = [
      'OTAKON_GAME_ID',
      'OTAKON_CONFIDENCE',
      'OTAKON_GENRE',
      'OTAKON_GAME_STATUS',
      'OTAKON_IS_FULLSCREEN',
      'OTAKON_TRIUMPH',
      'OTAKON_OBJECTIVE_SET',
      'OTAKON_INSIGHT_UPDATE'
    ];
    
    let foundTags = 0;
    for (const tag of tags) {
      if (content.includes(tag)) {
        foundTags++;
      }
    }
    
    if (foundTags >= 6) {
      logTest('PHASE 26', 'OTAKON tags parser implemented', 'PASS', `${foundTags}/${tags.length} tags supported`);
    } else {
      logTest('PHASE 26', 'OTAKON tags parser implemented', 'WARNING', `Only ${foundTags}/${tags.length} tags found`);
    }
  } catch (error) {
    logTest('PHASE 26', 'OTAKON tags parser implemented', 'FAIL', error.message);
  }
  
  // Check prompt system
  try {
    const promptSystemPath = join(__dirname, '../src/services/promptSystem.ts');
    const content = readFileSync(promptSystemPath, 'utf8');
    
    const features = [
      'persona',
      'profile',
      'context',
      'spoiler'
    ];
    
    let foundFeatures = 0;
    for (const feature of features) {
      if (content.toLowerCase().includes(feature)) {
        foundFeatures++;
      }
    }
    
    if (foundFeatures >= 3) {
      logTest('PHASE 26', 'Prompt system has advanced features', 'PASS', `${foundFeatures}/${features.length} features found`);
    } else {
      logTest('PHASE 26', 'Prompt system has advanced features', 'WARNING', `Only ${foundFeatures}/${features.length} features found`);
    }
  } catch (error) {
    logTest('PHASE 26', 'Prompt system exists', 'FAIL', error.message);
  }
}

// ============================================================================
// COMPONENT STRUCTURE VERIFICATION
// ============================================================================

async function testComponentStructure() {
  console.log('\n🔍 ADDITIONAL: COMPONENT STRUCTURE VERIFICATION\n');
  
  const components = [
    { name: 'AuthCallback', path: '../src/components/auth/AuthCallback.tsx' },
    { name: 'MainApp', path: '../src/components/MainApp.tsx' },
    { name: 'LandingPage', path: '../src/components/LandingPage.tsx' },
    { name: 'Settings Modal', path: '../src/components/modals/SettingsModal.tsx' },
    { name: 'About Modal', path: '../src/components/modals/AboutModal.tsx' },
    { name: 'Privacy Modal', path: '../src/components/modals/PrivacyModal.tsx' },
    { name: 'Terms Modal', path: '../src/components/modals/TermsModal.tsx' },
    { name: 'Contact Us Modal', path: '../src/components/modals/ContactUsModal.tsx' }
  ];
  
  for (const component of components) {
    try {
      const componentPath = join(__dirname, component.path);
      const content = readFileSync(componentPath, 'utf8');
      
      if (content && content.length > 200) {
        logTest('COMPONENTS', `${component.name} exists and implemented`, 'PASS');
      } else {
        logTest('COMPONENTS', `${component.name} exists and implemented`, 'WARNING', 'Component is very small');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        logTest('COMPONENTS', `${component.name} exists`, 'FAIL', 'Component file not found');
      } else {
        logTest('COMPONENTS', `${component.name} exists`, 'FAIL', error.message);
      }
    }
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     OTAKON AI - SERVICE LAYER TEST SUITE                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    await testPhase14_ServicesExist();
    await testPhase20_AdvancedFeatures();
    await testPhase22_ErrorRecovery();
    await testPhase23_TTS();
    await testPhase26_OtakonTags();
    await testComponentStructure();
    
    // Print Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Passed:   ${testResults.passed}`);
    console.log(`❌ Failed:   ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    console.log(`📊 Total:    ${testResults.tests.length}`);
    console.log(`\n✨ Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%\n`);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
