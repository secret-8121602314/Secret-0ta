#!/usr/bin/env node

/**
 * Quick Validation Script for P0.1 Race Condition Fix
 * 
 * This script performs static analysis on LoginSplashScreen.tsx
 * to verify the race condition fix is correctly implemented.
 * 
 * Usage:
 *   node test-suite/validate-race-fix.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('═'.repeat(70), 'blue');
  log(title, 'bold');
  log('═'.repeat(70), 'blue');
}

// Main validation
async function validateRaceFix() {
  log('🧪 P0.1 Race Condition Fix - Static Analysis', 'bold');
  log('Date: ' + new Date().toISOString(), 'blue');
  
  const results = {
    checks: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
  };
  
  function check(name, passed, message, isWarning = false) {
    results.checks++;
    if (passed) {
      results.passed++;
      log(`✅ PASS: ${name}`, 'green');
    } else if (isWarning) {
      results.warnings++;
      log(`⚠️  WARN: ${name}`, 'yellow');
    } else {
      results.failed++;
      log(`❌ FAIL: ${name}`, 'red');
      results.issues.push({ check: name, message });
    }
    if (message) {
      log(`   ${message}`);
    }
  }
  
  // ============================================================================
  // CHECK 1: File exists
  // ============================================================================
  logSection('CHECK 1: Verify File Exists');
  
  const filePath = path.join(__dirname, '..', 'src', 'components', 'splash', 'LoginSplashScreen.tsx');
  
  if (!fs.existsSync(filePath)) {
    check('File exists', false, `File not found: ${filePath}`);
    return results;
  }
  
  check('File exists', true, `Found: ${filePath}`);
  
  // ============================================================================
  // CHECK 2: Read file content
  // ============================================================================
  logSection('CHECK 2: Read File Content');
  
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
    check('File readable', true, `File size: ${fileContent.length} bytes`);
  } catch (error) {
    check('File readable', false, error.message);
    return results;
  }
  
  // ============================================================================
  // CHECK 3: Verify OLD bug is removed
  // ============================================================================
  logSection('CHECK 3: Verify OLD Bug Pattern Removed');
  
  // Look for the old dangerous pattern
  const oldBugPatterns = [
    /onComplete\(\);\s*setIsLoading\(true\);\s*result\s*=\s*await\s+authService\.signInWithEmail/,
    /onComplete\(\);\s*\/\/.*\s*setIsLoading\(true\);\s*result\s*=\s*await/,
    /Set view to app immediately to prevent flash\s*\n\s*onComplete\(\);/
  ];
  
  let foundOldBug = false;
  oldBugPatterns.forEach((pattern, index) => {
    if (pattern.test(fileContent)) {
      foundOldBug = true;
      check(`Old bug pattern ${index + 1} removed`, false, 'Found old race condition code!');
    }
  });
  
  if (!foundOldBug) {
    check('Old bug pattern removed', true, 'No traces of old race condition found');
  }
  
  // ============================================================================
  // CHECK 4: Verify NEW fix is present
  // ============================================================================
  logSection('CHECK 4: Verify NEW Fix Pattern Present');
  
  // Look for correct pattern: await BEFORE onComplete()
  const correctPatterns = {
    awaitBeforeComplete: /result\s*=\s*await\s+authService\.signInWithEmail.*?onComplete\(\)/s,
    successCheck: /if\s*\(\s*result\.success\s*\)/,
    onCompleteInSuccessBlock: /if\s*\(\s*result\.success\s*\)[\s\S]*?onComplete\(\)/
  };
  
  if (correctPatterns.awaitBeforeComplete.test(fileContent)) {
    check('Await before onComplete', true, 'Auth completes before navigation');
  } else {
    check('Await before onComplete', false, 'Cannot verify auth order');
  }
  
  if (correctPatterns.successCheck.test(fileContent)) {
    check('Success check present', true, 'result.success check found');
  } else {
    check('Success check present', false, 'Missing success check');
  }
  
  if (correctPatterns.onCompleteInSuccessBlock.test(fileContent)) {
    check('onComplete in success block', true, 'Navigation only on success');
  } else {
    check('onComplete in success block', false, 'onComplete may not be in success block');
  }
  
  // ============================================================================
  // CHECK 5: Line-by-line analysis
  // ============================================================================
  logSection('CHECK 5: Detailed Code Flow Analysis');
  
  const lines = fileContent.split('\n');
  let inSignInBlock = false;
  let foundAwaitSignIn = false;
  let foundOnComplete = false;
  let awaitSignInLine = 0;
  let onCompleteLine = 0;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Detect sign-in block
    if (trimmed.includes("emailMode === 'signin'")) {
      inSignInBlock = true;
    }
    
    if (inSignInBlock) {
      // Look for await signInWithEmail
      if (trimmed.includes('await authService.signInWithEmail')) {
        foundAwaitSignIn = true;
        awaitSignInLine = lineNum;
      }
      
      // Look for onComplete()
      if (trimmed.includes('onComplete()')) {
        foundOnComplete = true;
        onCompleteLine = lineNum;
      }
      
      // Exit sign-in block
      if (trimmed.includes('} else {') && foundAwaitSignIn) {
        inSignInBlock = false;
      }
    }
  });
  
  log(`\nCode Flow Details:`, 'blue');
  log(`   await authService.signInWithEmail: Line ${awaitSignInLine}`);
  log(`   onComplete() call: Line ${onCompleteLine}`);
  
  if (foundAwaitSignIn && foundOnComplete) {
    if (onCompleteLine > awaitSignInLine) {
      const lineGap = onCompleteLine - awaitSignInLine;
      check(
        'Correct code order', 
        true, 
        `onComplete() is ${lineGap} lines after await (CORRECT)`
      );
    } else {
      check(
        'Correct code order', 
        false, 
        'onComplete() appears BEFORE await (RACE CONDITION!)'
      );
    }
  } else {
    check('Code flow analysis', false, 'Could not locate both statements', true);
  }
  
  // ============================================================================
  // CHECK 6: Error handling
  // ============================================================================
  logSection('CHECK 6: Error Handling Verification');
  
  const errorPatterns = {
    failureBlock: /if\s*\(\s*result\.success\s*\)[\s\S]*?}\s*else\s*{/,
    resetView: /onSetAppState.*view.*landing.*login/,
    errorMessage: /setErrorMessage/
  };
  
  if (errorPatterns.failureBlock.test(fileContent)) {
    check('Failure handling exists', true, 'else block present for failed auth');
  } else {
    check('Failure handling exists', false, 'Missing failure handling');
  }
  
  if (errorPatterns.resetView.test(fileContent)) {
    check('View reset on failure', true, 'Returns to login on failure');
  } else {
    check('View reset on failure', false, 'May not reset view on failure', true);
  }
  
  if (errorPatterns.errorMessage.test(fileContent)) {
    check('Error message shown', true, 'setErrorMessage found');
  } else {
    check('Error message shown', false, 'May not show error message', true);
  }
  
  // ============================================================================
  // CHECK 7: Verify comments/documentation
  // ============================================================================
  logSection('CHECK 7: Code Documentation');
  
  if (fileContent.includes('FIXED')) {
    check('Fix documented', true, 'Found FIXED comments in code');
  } else {
    check('Fix documented', false, 'No documentation of fix', true);
  }
  
  if (fileContent.includes('race condition')) {
    check('Race condition mentioned', true, 'Comments explain race condition');
  } else {
    check('Race condition mentioned', false, 'No mention of race condition', true);
  }
  
  // ============================================================================
  // FINAL RESULTS
  // ============================================================================
  logSection('FINAL VALIDATION RESULTS');
  
  log(`\nTotal Checks: ${results.checks}`);
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  
  const successRate = ((results.passed / results.checks) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'red');
  
  console.log('');
  
  if (results.failed === 0) {
    log('🎉 VALIDATION PASSED! Race condition fix is correctly implemented.', 'green');
    log('✅ Safe to deploy to staging for manual testing.', 'green');
  } else {
    log('⚠️  VALIDATION FAILED! Issues found:', 'red');
    results.issues.forEach((issue, index) => {
      log(`\n${index + 1}. ${issue.check}`, 'red');
      log(`   ${issue.message}`);
    });
    log('\n❌ DO NOT DEPLOY until issues are resolved.', 'red');
  }
  
  log('\n═'.repeat(70), 'blue');
  log('Validation completed at: ' + new Date().toISOString(), 'blue');
  log('═'.repeat(70), 'blue');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run validation
validateRaceFix().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});
