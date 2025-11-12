/**
 * Browser Console Test Script for P0.1 Race Condition Fix
 * 
 * HOW TO USE:
 * 1. Open your app in browser
 * 2. Navigate to login screen
 * 3. Open Chrome DevTools (F12)
 * 4. Go to Console tab
 * 5. Copy and paste this entire script
 * 6. Press Enter to run
 * 7. Follow the prompts
 * 
 * This script will:
 * - Monitor onComplete() calls
 * - Track authentication state
 * - Detect race conditions
 * - Report timing information
 */

(async function testRaceCondition() {
  console.log('🧪 Starting P0.1 Race Condition Test Suite\n');
  console.log('═'.repeat(60));
  
  // Test Configuration
  const TEST_EMAIL = 'test-race-condition@otakon.ai';
  const TEST_PASSWORD = 'TestPass123!';
  
  // Test Results
  const results = {
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    issues: []
  };
  
  // Helper: Log test result
  function logTest(name, passed, message) {
    results.testsRun++;
    if (passed) {
      results.testsPassed++;
      console.log(`✅ PASS: ${name}`);
    } else {
      results.testsFailed++;
      console.log(`❌ FAIL: ${name}`);
      results.issues.push({ test: name, message });
    }
    if (message) {
      console.log(`   ${message}`);
    }
  }
  
  // Helper: Wait for element
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }
      }, 100);
    });
  }
  
  // Helper: Wait for navigation
  function waitForNavigation(timeout = 5000) {
    return new Promise((resolve) => {
      const startUrl = window.location.href;
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.location.href !== startUrl || Date.now() - startTime > timeout) {
          clearInterval(interval);
          resolve(window.location.href);
        }
      }, 100);
    });
  }
  
  console.log('\n📋 Test Configuration:');
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${'*'.repeat(TEST_PASSWORD.length)}`);
  console.log(`   Current URL: ${window.location.href}`);
  console.log('═'.repeat(60));
  
  // ============================================================================
  // TEST 1: Check if on login screen
  // ============================================================================
  console.log('\n🔍 TEST 1: Verify on login screen');
  try {
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const signInButton = document.querySelector('button:has-text("Sign In")') || 
                        Array.from(document.querySelectorAll('button'))
                          .find(btn => btn.textContent.includes('Sign In'));
    
    if (emailInput && passwordInput) {
      logTest('Login screen elements found', true, 'Email and password inputs present');
    } else {
      logTest('Login screen elements found', false, 'Missing email or password input');
      console.log('\n⚠️ STOPPING: Cannot continue tests without login form');
      return;
    }
  } catch (error) {
    logTest('Login screen elements found', false, error.message);
    return;
  }
  
  // ============================================================================
  // TEST 2: Monitor onComplete() timing
  // ============================================================================
  console.log('\n🔍 TEST 2: Monitor navigation timing');
  
  let onCompleteCallTime = null;
  let authStartTime = null;
  let authEndTime = null;
  let navigationOccurred = false;
  
  // Intercept fetch to detect auth request
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('auth') || url.includes('signin'))) {
      console.log(`   📡 Auth request started: ${new Date().toISOString()}`);
      authStartTime = Date.now();
    }
    
    const response = await originalFetch.apply(this, args);
    
    if (typeof url === 'string' && (url.includes('auth') || url.includes('signin'))) {
      authEndTime = Date.now();
      console.log(`   ✓ Auth request completed: ${new Date().toISOString()}`);
      console.log(`   ⏱️ Auth duration: ${authEndTime - authStartTime}ms`);
    }
    
    return response;
  };
  
  // Monitor navigation
  const originalHref = window.location.href;
  const navigationObserver = setInterval(() => {
    if (window.location.href !== originalHref) {
      onCompleteCallTime = Date.now();
      navigationOccurred = true;
      console.log(`   🚀 Navigation occurred: ${new Date().toISOString()}`);
      clearInterval(navigationObserver);
    }
  }, 50);
  
  // ============================================================================
  // TEST 3: Fill form and submit
  // ============================================================================
  console.log('\n🔍 TEST 3: Fill login form and submit');
  try {
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    
    // Fill form
    emailInput.value = TEST_EMAIL;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    passwordInput.value = TEST_PASSWORD;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('   ✓ Form filled');
    
    // Find and click sign in button
    const signInButton = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Sign In'));
    
    if (!signInButton) {
      throw new Error('Sign In button not found');
    }
    
    console.log('   ⏳ Clicking Sign In button...');
    signInButton.click();
    
    logTest('Form submission', true, 'Sign In button clicked successfully');
  } catch (error) {
    logTest('Form submission', false, error.message);
    clearInterval(navigationObserver);
    window.fetch = originalFetch;
    return;
  }
  
  // ============================================================================
  // TEST 4: Wait for auth to complete and analyze timing
  // ============================================================================
  console.log('\n🔍 TEST 4: Analyze race condition timing');
  
  // Wait up to 10 seconds for navigation
  await new Promise(resolve => setTimeout(resolve, 10000));
  clearInterval(navigationObserver);
  
  // Restore fetch
  window.fetch = originalFetch;
  
  // Analyze timing
  console.log('\n📊 Timing Analysis:');
  console.log(`   Auth Start: ${authStartTime ? `${authStartTime}ms` : 'NOT DETECTED'}`);
  console.log(`   Auth End: ${authEndTime ? `${authEndTime}ms` : 'NOT DETECTED'}`);
  console.log(`   Navigation: ${onCompleteCallTime ? `${onCompleteCallTime}ms` : 'NOT DETECTED'}`);
  
  if (authStartTime && authEndTime && onCompleteCallTime) {
    const navigationAfterAuthStart = onCompleteCallTime - authStartTime;
    const navigationAfterAuthEnd = onCompleteCallTime - authEndTime;
    
    console.log(`\n   Navigation timing:`);
    console.log(`   - ${navigationAfterAuthStart}ms after auth START`);
    console.log(`   - ${navigationAfterAuthEnd}ms after auth END`);
    
    if (navigationAfterAuthEnd >= 0) {
      logTest(
        'Race condition check', 
        true, 
        `✅ Navigation occurred ${navigationAfterAuthEnd}ms AFTER auth completed (CORRECT)`
      );
    } else {
      logTest(
        'Race condition check', 
        false, 
        `❌ Navigation occurred ${Math.abs(navigationAfterAuthEnd)}ms BEFORE auth completed (RACE CONDITION!)`
      );
    }
  } else {
    logTest('Race condition check', false, 'Could not detect timing (check manually)');
  }
  
  // ============================================================================
  // TEST 5: Check for navigation flash
  // ============================================================================
  console.log('\n🔍 TEST 5: Check navigation behavior');
  
  if (navigationOccurred) {
    logTest('Navigation occurred', true, `Now at: ${window.location.href}`);
    
    // Check if we're on app screen (not back on login)
    const stillOnLogin = document.querySelector('input[type="email"]') && 
                        document.querySelector('input[type="password"]');
    
    if (stillOnLogin) {
      logTest('No redirect loop', false, 'Returned to login screen (possible race condition)');
    } else {
      logTest('No redirect loop', true, 'Successfully navigated to app (no loop)');
    }
  } else {
    logTest('Navigation occurred', false, 'No navigation detected (check credentials or network)');
  }
  
  // ============================================================================
  // TEST 6: Check localStorage
  // ============================================================================
  console.log('\n🔍 TEST 6: Check localStorage (if remember me enabled)');
  
  const rememberMe = localStorage.getItem('otakon_remember_me');
  const rememberedEmail = localStorage.getItem('otakon_remembered_email');
  
  if (rememberMe === 'true' || rememberedEmail) {
    console.log(`   ✓ Remember me: ${rememberMe}`);
    console.log(`   ✓ Remembered email: ${rememberedEmail}`);
    logTest('Remember me feature', true, 'localStorage updated correctly');
  } else {
    console.log('   ℹ️ Remember me not enabled (this is OK if checkbox was not checked)');
  }
  
  // ============================================================================
  // FINAL RESULTS
  // ============================================================================
  console.log('\n═'.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`\nTests Run: ${results.testsRun}`);
  console.log(`✅ Passed: ${results.testsPassed}`);
  console.log(`❌ Failed: ${results.testsFailed}`);
  
  if (results.testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Race condition fix is working correctly.');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED. Issues found:');
    results.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.test}`);
      console.log(`   ${issue.message}`);
    });
  }
  
  console.log('\n═'.repeat(60));
  console.log('Test completed at:', new Date().toISOString());
  console.log('═'.repeat(60));
  
  return results;
})();
