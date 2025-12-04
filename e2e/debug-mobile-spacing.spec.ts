/**
 * Debug test for mobile PWA spacing issue
 * 
 * This test investigates the "black space below chat input" issue that:
 * 1. Appears during/after onboarding
 * 2. Increases when ProfileSetupBanner is dismissed
 */

import { test, expect } from '@playwright/test';

// Mobile viewport (iPhone 14 Pro)
const MOBILE_VIEWPORT = { width: 393, height: 852 };

// Helper to get layout measurements
async function getLayoutMeasurements(page: any) {
  return await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const appContainer = document.querySelector('.app-container');
    const chatInterface = document.querySelector('[class*="h-full"][class*="flex-col"]');
    const inputSection = document.querySelector('form[class*="rounded-2xl"]')?.parentElement?.parentElement;
    const profileBanner = document.querySelector('[class*="ProfileSetupBanner"]') || 
                          document.querySelector('[class*="animate-fade-slide-down"]');
    
    // Find the flex-1 chat area container
    const mainContent = appContainer?.querySelector(':scope > div:not([class*="Sidebar"])');
    const chatArea = mainContent?.querySelector('[class*="flex-1"][class*="flex-col"]');
    
    // Get computed styles
    const getComputedInfo = (el: Element | null, name: string) => {
      if (!el) return { name, exists: false };
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        computedHeight: computed.height,
        computedMinHeight: computed.minHeight,
        computedMaxHeight: computed.maxHeight,
        computedFlex: computed.flex,
        computedFlexGrow: computed.flexGrow,
        computedFlexShrink: computed.flexShrink,
        computedOverflow: computed.overflow,
        computedPosition: computed.position,
      };
    };

    return {
      viewport: {
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        visualViewportHeight: window.visualViewport?.height,
        devicePixelRatio: window.devicePixelRatio,
      },
      elements: {
        html: getComputedInfo(html, 'html'),
        body: getComputedInfo(body, 'body'),
        root: getComputedInfo(root, '#root'),
        appContainer: getComputedInfo(appContainer, '.app-container'),
        mainContent: getComputedInfo(mainContent, 'mainContent'),
        chatArea: getComputedInfo(chatArea, 'chatArea'),
        chatInterface: getComputedInfo(chatInterface, 'chatInterface'),
        inputSection: getComputedInfo(inputSection, 'inputSection'),
        profileBanner: getComputedInfo(profileBanner, 'profileBanner'),
      },
      bodyStyles: {
        overflow: window.getComputedStyle(body).overflow,
        position: window.getComputedStyle(body).position,
        height: window.getComputedStyle(body).height,
      },
      // Check for any black/empty space at bottom
      spaceAnalysis: (() => {
        if (!inputSection) return { error: 'No input section found' };
        const inputRect = inputSection.getBoundingClientRect();
        const viewportBottom = window.innerHeight;
        const spaceBelow = viewportBottom - inputRect.bottom;
        return {
          inputBottom: inputRect.bottom,
          viewportBottom,
          spaceBelow,
          hasExcessSpace: spaceBelow > 20, // More than 20px is suspicious
        };
      })(),
    };
  });
}

// Helper to log measurements nicely
function logMeasurements(label: string, measurements: any) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📏 LAYOUT MEASUREMENTS: ${label}`);
  console.log('='.repeat(60));
  
  console.log('\n📱 Viewport:');
  console.log(`   innerHeight: ${measurements.viewport.innerHeight}px`);
  console.log(`   innerWidth: ${measurements.viewport.innerWidth}px`);
  console.log(`   visualViewportHeight: ${measurements.viewport.visualViewportHeight}px`);
  
  console.log('\n📦 Element Heights:');
  for (const [key, el] of Object.entries(measurements.elements) as any) {
    if (el.exists) {
      console.log(`   ${el.name}: height=${el.height}px, top=${el.top}, bottom=${el.bottom}`);
      console.log(`      flex: ${el.computedFlex}, flexGrow: ${el.computedFlexGrow}`);
    } else {
      console.log(`   ${el.name}: NOT FOUND`);
    }
  }
  
  console.log('\n🔍 Space Analysis:');
  if (measurements.spaceAnalysis.error) {
    console.log(`   ERROR: ${measurements.spaceAnalysis.error}`);
  } else {
    console.log(`   Input bottom: ${measurements.spaceAnalysis.inputBottom}px`);
    console.log(`   Viewport bottom: ${measurements.spaceAnalysis.viewportBottom}px`);
    console.log(`   Space below input: ${measurements.spaceAnalysis.spaceBelow}px`);
    console.log(`   Has excess space: ${measurements.spaceAnalysis.hasExcessSpace ? '⚠️ YES' : '✅ NO'}`);
  }
  
  console.log('\n📋 Body Styles:');
  console.log(`   position: ${measurements.bodyStyles.position}`);
  console.log(`   overflow: ${measurements.bodyStyles.overflow}`);
  console.log(`   height: ${measurements.bodyStyles.height}`);
}

test.describe('Mobile PWA Spacing Debug', () => {
  
  test('Debug: Measure layout at each stage of login/onboarding flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
        console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
      }
    });

    console.log('\n🚀 Starting Mobile PWA Spacing Debug Test');
    console.log(`Viewport: ${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}`);

    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 1: Initial load (login screen)
    let measurements = await getLayoutMeasurements(page);
    logMeasurements('Step 1: Initial Load (Login Screen)', measurements);

    // Check if we're on login screen
    const loginButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Continue")');
    const isLoginScreen = await loginButton.first().isVisible().catch(() => false);
    
    if (isLoginScreen) {
      console.log('\n📍 On login screen - checking for spacing issues...');
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/debug-1-login-screen.png', fullPage: true });
    }

    // Try to find email input for login
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const hasEmailInput = await emailInput.first().isVisible().catch(() => false);

    if (hasEmailInput) {
      console.log('\n📝 Found email input - attempting test login...');
      
      // Fill test credentials (this will fail but we can see the layout)
      await emailInput.first().fill('test@example.com');
      
      const passwordInput = page.locator('input[type="password"]');
      if (await passwordInput.first().isVisible().catch(() => false)) {
        await passwordInput.first().fill('testpassword123');
      }

      // Measure after filling form
      measurements = await getLayoutMeasurements(page);
      logMeasurements('Step 2: After Filling Login Form', measurements);
      await page.screenshot({ path: 'test-results/debug-2-login-form-filled.png', fullPage: true });
    }

    // If already logged in, check main app
    const appContainer = page.locator('.app-container');
    if (await appContainer.isVisible().catch(() => false)) {
      console.log('\n📱 Already in main app - measuring layout...');
      
      measurements = await getLayoutMeasurements(page);
      logMeasurements('Main App Layout', measurements);
      await page.screenshot({ path: 'test-results/debug-3-main-app.png', fullPage: true });

      // Check for ProfileSetupBanner
      const profileBanner = page.locator('[class*="ProfileSetupBanner"], [class*="profile-setup"], [class*="animate-fade-slide-down"]');
      if (await profileBanner.first().isVisible().catch(() => false)) {
        console.log('\n🎯 ProfileSetupBanner is visible!');
        
        measurements = await getLayoutMeasurements(page);
        logMeasurements('With ProfileSetupBanner Visible', measurements);
        await page.screenshot({ path: 'test-results/debug-4-with-profile-banner.png', fullPage: true });

        // Try to find and click the dismiss button
        const dismissButton = page.locator('button:has-text("Skip"), button:has-text("Later"), button:has-text("×"), button:has-text("Close")');
        if (await dismissButton.first().isVisible().catch(() => false)) {
          console.log('\n🔘 Clicking dismiss button...');
          await dismissButton.first().click();
          await page.waitForTimeout(500);

          measurements = await getLayoutMeasurements(page);
          logMeasurements('After Dismissing ProfileSetupBanner', measurements);
          await page.screenshot({ path: 'test-results/debug-5-after-dismiss-banner.png', fullPage: true });

          // Check if space increased
          if (measurements.spaceAnalysis.hasExcessSpace) {
            console.log('\n⚠️ ISSUE DETECTED: Excess space below input after dismissing banner!');
            console.log(`   Space: ${measurements.spaceAnalysis.spaceBelow}px`);
          }
        }
      }

      // Check for AdBanner
      const adBanner = page.locator('.adsbygoogle, [class*="AdBanner"]');
      if (await adBanner.first().isVisible().catch(() => false)) {
        console.log('\n📺 AdBanner is visible');
        const adRect = await adBanner.first().boundingBox();
        if (adRect) {
          console.log(`   Position: top=${adRect.y}, height=${adRect.height}`);
        }
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    const finalMeasurements = await getLayoutMeasurements(page);
    if (finalMeasurements.spaceAnalysis.hasExcessSpace) {
      console.log(`\n❌ PROBLEM: ${finalMeasurements.spaceAnalysis.spaceBelow}px of unexplained space below input`);
      
      // Detailed analysis
      console.log('\n🔬 Detailed Analysis:');
      const viewport = finalMeasurements.viewport.innerHeight;
      const inputBottom = finalMeasurements.spaceAnalysis.inputBottom;
      
      console.log(`   Expected: Input should reach near bottom (viewport: ${viewport}px)`);
      console.log(`   Actual: Input ends at ${inputBottom}px`);
      console.log(`   Gap: ${viewport - inputBottom}px`);
      
      // Check each container
      for (const [key, el] of Object.entries(finalMeasurements.elements) as any) {
        if (el.exists && el.height < viewport * 0.9) {
          console.log(`   ⚠️ ${el.name} may be too short: ${el.height}px (${((el.height/viewport)*100).toFixed(1)}% of viewport)`);
        }
      }
    } else {
      console.log('\n✅ Layout appears correct - no excess space detected');
    }
  });

  test('Debug: Simulate PWA standalone mode', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Inject standalone mode detection
    await page.addInitScript(() => {
      // Simulate PWA standalone mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query.includes('display-mode: standalone'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    console.log('\n🚀 Testing PWA Standalone Mode Simulation');

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if standalone CSS is applied
    const bodyPosition = await page.evaluate(() => {
      return window.getComputedStyle(document.body).position;
    });

    console.log(`Body position in simulated standalone mode: ${bodyPosition}`);

    const measurements = await getLayoutMeasurements(page);
    logMeasurements('PWA Standalone Mode', measurements);
    
    await page.screenshot({ path: 'test-results/debug-pwa-standalone.png', fullPage: true });
  });

  test('Debug: Check flex container behavior', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('\n🔧 Checking Flex Container Behavior');

    // Detailed flex analysis
    const flexAnalysis = await page.evaluate(() => {
      const results: any[] = [];
      
      // Find all flex containers
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'flex' || style.display === 'inline-flex') {
          const rect = el.getBoundingClientRect();
          // Only log visible containers that are reasonably sized
          if (rect.height > 50 && rect.width > 100) {
            results.push({
              tag: el.tagName,
              className: el.className.substring(0, 100),
              flexDirection: style.flexDirection,
              height: rect.height,
              width: rect.width,
              overflow: style.overflow,
              children: el.children.length,
            });
          }
        }
      });
      
      return results.slice(0, 20); // Limit output
    });

    console.log('\n📦 Flex Containers Found:');
    flexAnalysis.forEach((container, i) => {
      console.log(`\n${i + 1}. ${container.tag} (${container.children} children)`);
      console.log(`   class: ${container.className}`);
      console.log(`   direction: ${container.flexDirection}, size: ${container.width}x${container.height}`);
      console.log(`   overflow: ${container.overflow}`);
    });
  });
});
