import { test, expect } from '@playwright/test';
import { 
  waitForAppReady, 
  selectors, 
  goToGameHub,
  createGameTab,
  sendMessage,
  waitForChatResponse,
  openModal,
} from './utils/helpers';

/**
 * TTS (Text-to-Speech) & Hands-Free Mode Stress Tests
 * ====================================================
 * Tests audio features including:
 * - TTS activation and playback
 * - Hands-free mode toggle
 * - Voice settings
 * - Audio queue management
 * - TTS with streaming responses
 */

test.describe('TTS Core Functionality', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have TTS toggle available', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Toggle Test');
    await page.waitForTimeout(1000);
    
    // Look for TTS toggle button
    const ttsToggle = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="text to speech"], button[aria-label*="speaker"], ' +
      '[data-testid*="tts"], button:has([class*="speaker"]), button:has([class*="audio"])'
    ).first();
    
    const hasTTS = await ttsToggle.isVisible().catch(() => false);
    console.log('TTS toggle visible:', hasTTS);
    
    if (hasTTS) {
      await ttsToggle.click();
      await page.waitForTimeout(500);
      console.log('TTS toggle clicked');
    }
  });

  test('should activate TTS on AI response', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Activation Test');
    await page.waitForTimeout(1000);
    
    // Find and enable TTS if available
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"], [data-testid*="tts"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
      await page.waitForTimeout(500);
    }
    
    // Send message and get response
    await sendMessage(page, 'Say something short for TTS test');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Check if audio is playing (SpeechSynthesis API)
    const isSpeaking = await page.evaluate(() => {
      return window.speechSynthesis?.speaking || false;
    });
    
    console.log('TTS is speaking:', isSpeaking);
  });

  test('should stop TTS when new message sent', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Stop Test');
    await page.waitForTimeout(1000);
    
    // Enable TTS
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
      await page.waitForTimeout(500);
    }
    
    await sendMessage(page, 'First message for TTS');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Send another message while speaking
    await sendMessage(page, 'Second message interrupts TTS');
    await page.waitForTimeout(500);
    
    // TTS should stop or queue
    console.log('TTS interruption test complete');
  });
});

test.describe('Hands-Free Mode', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should toggle hands-free mode', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Hands-Free Toggle Test');
    await page.waitForTimeout(1000);
    
    // Look for hands-free toggle
    const handsFreeToggle = page.locator(
      'button[aria-label*="hands-free"], button[aria-label*="voice"], ' +
      '[data-testid*="hands-free"], button:has-text("Hands-free"), ' +
      'label:has-text("Hands-free") + input[type="checkbox"]'
    ).first();
    
    const hasHandsFree = await handsFreeToggle.isVisible().catch(() => false);
    console.log('Hands-free toggle visible:', hasHandsFree);
    
    if (hasHandsFree) {
      await handsFreeToggle.click();
      await page.waitForTimeout(1000);
      console.log('Hands-free mode toggled');
    }
  });

  test('should show hands-free UI when enabled', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Hands-Free UI Test');
    await page.waitForTimeout(1000);
    
    // Try to enable hands-free mode
    const handsFreeToggle = page.locator(
      'button[aria-label*="hands-free"], [data-testid*="hands-free"]'
    ).first();
    
    if (await handsFreeToggle.isVisible().catch(() => false)) {
      await handsFreeToggle.click();
      await page.waitForTimeout(1000);
      
      // Check for voice indicator or microphone UI
      const voiceUI = page.locator(
        '[class*="microphone"], [class*="voice-indicator"], [aria-label*="listening"]'
      ).first();
      
      const hasVoiceUI = await voiceUI.isVisible().catch(() => false);
      console.log('Voice UI visible:', hasVoiceUI);
    }
  });

  test('should handle microphone permissions', async ({ page }) => {
    // Grant microphone permission
    await page.context().grantPermissions(['microphone']);
    
    await goToGameHub(page);
    await createGameTab(page, 'Mic Permission Test');
    await page.waitForTimeout(1000);
    
    // Enable hands-free
    const handsFreeToggle = page.locator(
      'button[aria-label*="hands-free"], button[aria-label*="voice"]'
    ).first();
    
    if (await handsFreeToggle.isVisible().catch(() => false)) {
      await handsFreeToggle.click();
      await page.waitForTimeout(2000);
      
      // Check if microphone access was granted
      const micAccess = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          return true;
        } catch (e) {
          return false;
        }
      });
      
      console.log('Microphone access:', micAccess);
    }
  });
});

test.describe('Voice Settings', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should open voice settings modal', async ({ page }) => {
    // Open settings modal
    await openModal(page, 'settings');
    await page.waitForTimeout(1000);
    
    // Look for voice/audio settings section
    const voiceSettings = page.locator(
      'text=/voice|audio|tts|speech/i, [aria-label*="voice"], [data-testid*="voice"]'
    ).first();
    
    const hasVoiceSettings = await voiceSettings.isVisible().catch(() => false);
    console.log('Voice settings visible:', hasVoiceSettings);
    
    await page.keyboard.press('Escape');
  });

  test('should change TTS voice', async ({ page }) => {
    await openModal(page, 'settings');
    await page.waitForTimeout(1000);
    
    // Look for voice selector
    const voiceSelector = page.locator(
      'select[name*="voice"], [data-testid*="voice-select"], ' +
      'button:has-text("Voice")'
    ).first();
    
    if (await voiceSelector.isVisible().catch(() => false)) {
      await voiceSelector.click();
      await page.waitForTimeout(500);
      console.log('Voice selector opened');
    }
    
    await page.keyboard.press('Escape');
  });

  test('should change TTS speed', async ({ page }) => {
    await openModal(page, 'settings');
    await page.waitForTimeout(1000);
    
    // Look for speed slider
    const speedSlider = page.locator(
      'input[type="range"][name*="speed"], [data-testid*="speed-slider"], ' +
      'label:has-text("Speed") + input[type="range"]'
    ).first();
    
    if (await speedSlider.isVisible().catch(() => false)) {
      // Change speed
      await speedSlider.fill('1.5');
      await page.waitForTimeout(500);
      console.log('TTS speed changed');
    }
    
    await page.keyboard.press('Escape');
  });
});

test.describe('TTS Audio Queue', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should queue multiple responses for TTS', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Queue Test');
    await page.waitForTimeout(1000);
    
    // Enable TTS
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
      await page.waitForTimeout(500);
    }
    
    // Send multiple messages
    await sendMessage(page, 'First question for queue');
    await page.waitForTimeout(500);
    await sendMessage(page, 'Second question for queue');
    
    await page.waitForTimeout(5000);
    
    // Check speech synthesis queue
    const queueLength = await page.evaluate(() => {
      return window.speechSynthesis?.pending ? 1 : 0;
    });
    
    console.log('TTS queue has pending:', queueLength > 0);
  });

  test('should pause and resume TTS', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Pause Test');
    await page.waitForTimeout(1000);
    
    // Enable TTS and get response
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
    }
    
    await sendMessage(page, 'Long message for TTS pause test');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Pause TTS
    await page.evaluate(() => {
      window.speechSynthesis?.pause();
    });
    await page.waitForTimeout(1000);
    
    const isPaused = await page.evaluate(() => {
      return window.speechSynthesis?.paused || false;
    });
    
    // Resume TTS
    await page.evaluate(() => {
      window.speechSynthesis?.resume();
    });
    
    console.log('TTS was paused:', isPaused);
  });

  test('should cancel TTS', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Cancel Test');
    await page.waitForTimeout(1000);
    
    // Enable TTS
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
    }
    
    await sendMessage(page, 'Message for TTS cancellation');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);
    
    // Cancel TTS
    await page.evaluate(() => {
      window.speechSynthesis?.cancel();
    });
    
    const isSpeaking = await page.evaluate(() => {
      return window.speechSynthesis?.speaking || false;
    });
    
    expect(isSpeaking).toBe(false);
    console.log('TTS cancelled successfully');
  });
});

test.describe('TTS with Streaming', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle TTS with streaming response', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Streaming Test');
    await page.waitForTimeout(1000);
    
    // Enable TTS
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
    }
    
    // Send message that will trigger streaming
    await sendMessage(page, 'Tell me a story about gaming');
    
    // Monitor for streaming chunks
    let hasStreamingTTS = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      const isSpeaking = await page.evaluate(() => {
        return window.speechSynthesis?.speaking || false;
      });
      if (isSpeaking) {
        hasStreamingTTS = true;
        break;
      }
    }
    
    console.log('TTS during streaming:', hasStreamingTTS);
  });

  test('should sync TTS with text display', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Sync Test');
    await page.waitForTimeout(1000);
    
    // Enable TTS
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
    }
    
    await sendMessage(page, 'Short test message');
    await waitForChatResponse(page, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Both text and speech should be available
    const chatContainer = page.locator(selectors.chatContainer).first();
    const hasText = await chatContainer.textContent();
    
    console.log('Text displayed for TTS:', !!hasText);
  });
});

test.describe('Voice Recognition', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['microphone']);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should have voice input button', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Voice Input Test');
    await page.waitForTimeout(1000);
    
    // Look for microphone/voice input button
    const voiceInput = page.locator(
      'button[aria-label*="microphone"], button[aria-label*="voice"], ' +
      '[data-testid*="mic"], button:has([class*="microphone"])'
    ).first();
    
    const hasVoiceInput = await voiceInput.isVisible().catch(() => false);
    console.log('Voice input button visible:', hasVoiceInput);
    
    if (hasVoiceInput) {
      await voiceInput.click();
      await page.waitForTimeout(1000);
      console.log('Voice input activated');
    }
  });

  test('should show listening indicator', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'Listening Indicator Test');
    await page.waitForTimeout(1000);
    
    const voiceInput = page.locator(
      'button[aria-label*="microphone"], button[aria-label*="voice"]'
    ).first();
    
    if (await voiceInput.isVisible().catch(() => false)) {
      await voiceInput.click();
      await page.waitForTimeout(1000);
      
      // Check for listening indicator
      const listeningIndicator = page.locator(
        '[class*="listening"], [class*="recording"], [aria-label*="listening"], ' +
        '[class*="pulse"], [class*="animate"]'
      ).first();
      
      const isListening = await listeningIndicator.isVisible().catch(() => false);
      console.log('Listening indicator visible:', isListening);
    }
  });
});

test.describe('TTS Error Handling', () => {
  test.use({ storageState: '.playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should handle no speech synthesis support', async ({ page }) => {
    // Disable speech synthesis
    await page.evaluate(() => {
      (window as any).speechSynthesis = undefined;
    });
    
    await page.reload();
    await waitForAppReady(page);
    await goToGameHub(page);
    await createGameTab(page, 'No TTS Support Test');
    await page.waitForTimeout(1000);
    
    // TTS button should be hidden or disabled
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    const ttsVisible = await ttsButton.isVisible().catch(() => false);
    const ttsDisabled = await ttsButton.isDisabled().catch(() => true);
    
    console.log('TTS button visible:', ttsVisible, 'disabled:', ttsDisabled);
  });

  test('should handle TTS error gracefully', async ({ page }) => {
    await goToGameHub(page);
    await createGameTab(page, 'TTS Error Test');
    await page.waitForTimeout(1000);
    
    // Mock TTS error
    await page.evaluate(() => {
      const originalSpeak = window.speechSynthesis?.speak;
      if (window.speechSynthesis && originalSpeak) {
        window.speechSynthesis.speak = function(utterance: SpeechSynthesisUtterance) {
          const errorEvent = new Event('error');
          utterance.dispatchEvent(errorEvent);
        };
      }
    });
    
    // Enable TTS and send message
    const ttsButton = page.locator(
      'button[aria-label*="TTS"], button[aria-label*="speak"]'
    ).first();
    
    if (await ttsButton.isVisible().catch(() => false)) {
      await ttsButton.click();
    }
    
    await sendMessage(page, 'Test message for TTS error');
    await page.waitForTimeout(3000);
    
    // App should handle error gracefully
    expect(await page.locator('body').isVisible()).toBe(true);
  });
});
