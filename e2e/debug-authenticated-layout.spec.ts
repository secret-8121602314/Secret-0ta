/**
 * Direct debug test for mobile PWA spacing issue
 * Tests the main app layout when authenticated
 */

import { test, expect } from '@playwright/test';

// Mobile viewport (iPhone 14 Pro)
const MOBILE_VIEWPORT = { width: 393, height: 852 };

// Helper to get comprehensive layout measurements
async function measureLayout(page: any, label: string) {
  const measurements = await page.evaluate(() => {
    const results: Record<string, any> = {};
    
    // Get viewport info
    results.viewport = {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      scrollY: window.scrollY,
    };
    
    // Measure key elements
    const elements = [
      { selector: 'html', name: 'html' },
      { selector: 'body', name: 'body' },
      { selector: '#root', name: '#root' },
      { selector: '.app-container', name: 'app-container' },
      { selector: 'header', name: 'header' },
      { selector: 'form', name: 'input-form' },
      { selector: 'textarea', name: 'textarea' },
    ];
    
    results.elements = {};
    
    for (const { selector, name } of elements) {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        results.elements[name] = {
          exists: true,
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height),
          computedHeight: style.height,
          overflow: style.overflow,
          position: style.position,
          display: style.display,
          flexDirection: style.flexDirection,
        };
      } else {
        results.elements[name] = { exists: false };
      }
    }
    
    // Find the actual bottom-most visible element
    const form = document.querySelector('form');
    if (form) {
      const formRect = form.getBoundingClientRect();
      results.formAnalysis = {
        formBottom: Math.round(formRect.bottom),
        viewportHeight: window.innerHeight,
        spaceBelow: Math.round(window.innerHeight - formRect.bottom),
      };
    }
    
    // Check all direct children of app-container
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      results.appContainerChildren = [];
      Array.from(appContainer.children).forEach((child, i) => {
        const rect = child.getBoundingClientRect();
        const style = window.getComputedStyle(child);
        results.appContainerChildren.push({
          index: i,
          tag: child.tagName,
          className: (child as HTMLElement).className?.substring(0, 60) || '',
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          flexGrow: style.flexGrow,
          flexShrink: style.flexShrink,
        });
      });
    }
    
    return results;
  });
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📐 LAYOUT: ${label}`);
  console.log('='.repeat(70));
  console.log(`Viewport: ${measurements.viewport.innerWidth}x${measurements.viewport.innerHeight}`);
  
  console.log('\n📦 Element Measurements:');
  for (const [name, el] of Object.entries(measurements.elements) as any) {
    if (el.exists) {
      console.log(`  ${name}: h=${el.height}px, top=${el.top}, bottom=${el.bottom}`);
      console.log(`    position=${el.position}, display=${el.display}, flex-dir=${el.flexDirection}`);
    } else {
      console.log(`  ${name}: NOT FOUND`);
    }
  }
  
  if (measurements.formAnalysis) {
    console.log('\n🔍 Form Position Analysis:');
    console.log(`  Form bottom: ${measurements.formAnalysis.formBottom}px`);
    console.log(`  Viewport height: ${measurements.formAnalysis.viewportHeight}px`);
    console.log(`  SPACE BELOW FORM: ${measurements.formAnalysis.spaceBelow}px`);
    if (measurements.formAnalysis.spaceBelow > 20) {
      console.log(`  ⚠️  EXCESS SPACE DETECTED!`);
    }
  }
  
  if (measurements.appContainerChildren) {
    console.log('\n📋 App Container Children:');
    measurements.appContainerChildren.forEach((child: any) => {
      console.log(`  [${child.index}] ${child.tag} - h=${child.height}px (${child.top}-${child.bottom})`);
      console.log(`      class: ${child.className}`);
      console.log(`      flex: grow=${child.flexGrow}, shrink=${child.flexShrink}`);
    });
  }
  
  return measurements;
}

// This test uses stored auth state
test.describe('Main App Layout Debug', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('Measure authenticated app layout', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[') || text.includes('Error')) {
        console.log(`[Browser]: ${text}`);
      }
    });

    console.log('\n🚀 Navigating to authenticated app...');
    
    // Navigate and wait for the app to load
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check if we're in the main app
    const appContainer = page.locator('.app-container');
    const isInApp = await appContainer.isVisible().catch(() => false);
    
    if (!isInApp) {
      console.log('❌ Not in main app - may need to re-authenticate');
      await page.screenshot({ path: 'test-results/debug-not-authenticated.png' });
      
      // Try to check what page we're on
      const pageContent = await page.content();
      console.log('Page contains app-container:', pageContent.includes('app-container'));
      console.log('Page contains login:', pageContent.toLowerCase().includes('login') || pageContent.toLowerCase().includes('sign in'));
      return;
    }

    console.log('✅ In main app!');
    
    // Take initial measurement
    await measureLayout(page, 'Initial App State');
    await page.screenshot({ path: 'test-results/debug-app-initial.png', fullPage: true });

    // Check for ProfileSetupBanner
    const profileBanner = page.locator('text=Set up your profile, text=gaming preferences, [class*="rounded-xl"][class*="border"]').first();
    const hasBanner = await profileBanner.isVisible().catch(() => false);
    
    if (hasBanner) {
      console.log('\n🎯 ProfileSetupBanner detected!');
      await measureLayout(page, 'With ProfileSetupBanner');
      await page.screenshot({ path: 'test-results/debug-with-banner.png', fullPage: true });
      
      // Try to dismiss it
      const skipButton = page.locator('button:has-text("Later"), button:has-text("Skip"), button:has-text("Close"), button[aria-label*="close"]').first();
      if (await skipButton.isVisible().catch(() => false)) {
        console.log('🔘 Clicking skip/close button...');
        await skipButton.click();
        await page.waitForTimeout(1000);
        
        await measureLayout(page, 'After Dismissing Banner');
        await page.screenshot({ path: 'test-results/debug-after-dismiss.png', fullPage: true });
      }
    }

    // Check for AdBanner
    const adBanner = page.locator('.adsbygoogle, [class*="adsbygoogle"]');
    if (await adBanner.isVisible().catch(() => false)) {
      console.log('\n📺 AdBanner is visible');
      const adRect = await adBanner.boundingBox();
      console.log(`   Ad position: top=${adRect?.y}, height=${adRect?.height}`);
    }

    // Final measurement
    console.log('\n📊 FINAL LAYOUT CHECK');
    const final = await measureLayout(page, 'Final State');
    
    // Assert no excess space
    if (final.formAnalysis && final.formAnalysis.spaceBelow > 50) {
      console.log(`\n❌ PROBLEM DETECTED: ${final.formAnalysis.spaceBelow}px of space below input!`);
      
      // Debug: check what's at the bottom
      const bottomElements = await page.evaluate(() => {
        const viewport = window.innerHeight;
        const elements: any[] = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom >= viewport - 100 && rect.bottom <= viewport + 50 && rect.height > 10) {
            elements.push({
              tag: el.tagName,
              className: (el as HTMLElement).className?.substring(0, 50),
              bottom: Math.round(rect.bottom),
              height: Math.round(rect.height),
            });
          }
        });
        return elements.slice(0, 10);
      });
      
      console.log('\n🔬 Elements near viewport bottom:');
      bottomElements.forEach(el => {
        console.log(`  ${el.tag} (${el.className}): bottom=${el.bottom}, h=${el.height}`);
      });
    }
    
    await page.screenshot({ path: 'test-results/debug-final.png', fullPage: true });
  });

  test('Simulate onboarding completion flow', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    console.log('\n🎮 Testing onboarding completion flow...');
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if we see onboarding
    const hasOnboarding = await page.locator('text=Welcome, text=gaming, button:has-text("Next"), button:has-text("Continue")').first().isVisible().catch(() => false);
    
    if (hasOnboarding) {
      console.log('📋 Onboarding screen detected');
      await measureLayout(page, 'Onboarding Screen');
      await page.screenshot({ path: 'test-results/debug-onboarding.png' });
      
      // Try to complete onboarding by clicking through
      for (let i = 0; i < 5; i++) {
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Done"), button:has-text("Start")').first();
        if (await nextBtn.isVisible().catch(() => false)) {
          console.log(`  Step ${i + 1}: Clicking next...`);
          await nextBtn.click();
          await page.waitForTimeout(500);
          await measureLayout(page, `After Step ${i + 1}`);
        } else {
          break;
        }
      }
    } else {
      console.log('No onboarding detected - may already be completed');
    }
    
    await measureLayout(page, 'After Onboarding');
    await page.screenshot({ path: 'test-results/debug-after-onboarding.png' });
  });
});
