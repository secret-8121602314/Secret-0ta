/**
 * Runtime Debug Injection for Mobile Spacing Issue
 * 
 * This adds a debug panel directly to the app to visualize layout issues
 */

import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 393, height: 852 };

test.describe('Runtime Layout Debug', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test('Inject debug panel into running app', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Listen to all console output
    page.on('console', msg => console.log(`[Page]: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Error]: ${err.message}`));
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Inject debug overlay
    await page.evaluate(() => {
      // Create debug panel
      const panel = document.createElement('div');
      panel.id = 'debug-panel';
      panel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.9);
        color: lime;
        font-family: monospace;
        font-size: 10px;
        padding: 4px;
        z-index: 99999;
        max-height: 40%;
        overflow-y: auto;
      `;
      document.body.appendChild(panel);
      
      // Update function
      const updateDebug = () => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        
        const appContainer = document.querySelector('.app-container');
        const form = document.querySelector('form');
        const textarea = document.querySelector('textarea');
        
        let html = `<b>Viewport:</b> ${vw}x${vh}<br>`;
        
        const measureEl = (el: Element | null, name: string) => {
          if (!el) return `${name}: NOT FOUND<br>`;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return `${name}: h=${Math.round(rect.height)}, top=${Math.round(rect.top)}, bot=${Math.round(rect.bottom)} | pos=${style.position}, flex=${style.flex}<br>`;
        };
        
        html += measureEl(document.documentElement, 'html');
        html += measureEl(document.body, 'body');
        html += measureEl(document.getElementById('root'), '#root');
        html += measureEl(appContainer, '.app-container');
        
        if (appContainer) {
          html += '<b>--- Children ---</b><br>';
          Array.from(appContainer.children).forEach((child, i) => {
            const rect = child.getBoundingClientRect();
            const cls = (child as HTMLElement).className?.substring(0, 30) || '';
            html += `[${i}] ${child.tagName} h=${Math.round(rect.height)} (${cls}...)<br>`;
          });
        }
        
        html += '<b>--- Input ---</b><br>';
        html += measureEl(form, 'form');
        html += measureEl(textarea, 'textarea');
        
        // Space analysis
        if (form) {
          const formRect = form.getBoundingClientRect();
          const space = vh - formRect.bottom;
          html += `<b style="color: ${space > 20 ? 'red' : 'lime'}">SPACE BELOW: ${Math.round(space)}px</b><br>`;
        }
        
        panel.innerHTML = html;
      };
      
      // Update periodically
      setInterval(updateDebug, 500);
      updateDebug();
      
      // Also log to console
      console.log('DEBUG PANEL INJECTED');
    });
    
    await page.screenshot({ path: 'test-results/debug-with-panel.png' });
    
    // Wait and observe
    console.log('\n⏳ Observing for 5 seconds...');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'test-results/debug-with-panel-after.png' });
  });
});
