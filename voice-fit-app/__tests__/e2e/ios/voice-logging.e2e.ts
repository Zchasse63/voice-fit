/**
 * Voice Logging E2E Test (iOS)
 * 
 * Tests the voice logging workflow on iOS simulator.
 * Note: Real voice testing requires manual testing on physical device.
 * These tests verify the UI flow and integration points.
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Voice Logging (iOS)', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        microphone: 'YES',
        speech: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display the app correctly', async () => {
    // Verify app launched
    await detoxExpect(element(by.text('START'))).toBeVisible();
  });

  it('should navigate to START tab', async () => {
    // Tap START tab
    await element(by.text('START')).tap();
    
    // Verify we're on START screen
    await detoxExpect(element(by.text('START Screen'))).toBeVisible();
  });

  it('should show voice FAB on START screen', async () => {
    // Navigate to START tab
    await element(by.text('START')).tap();
    
    // Verify voice FAB is visible
    await detoxExpect(element(by.id('voice-fab'))).toBeVisible();
  });

  it('should open voice input modal when FAB is tapped', async () => {
    // Navigate to START tab
    await element(by.text('START')).tap();
    
    // Tap voice FAB
    await element(by.id('voice-fab')).tap();
    
    // Verify modal opened
    await detoxExpect(element(by.text('Voice Input'))).toBeVisible();
    await detoxExpect(element(by.id('voice-input'))).toBeVisible();
  });

  it('should close voice input modal when X is tapped', async () => {
    // Navigate to START tab
    await element(by.text('START')).tap();
    
    // Open modal
    await element(by.id('voice-fab')).tap();
    await detoxExpect(element(by.text('Voice Input'))).toBeVisible();
    
    // Close modal
    await element(by.id('close-button')).tap();
    
    // Verify modal closed
    await detoxExpect(element(by.text('Voice Input'))).not.toBeVisible();
  });

  it('should accept text input for voice command simulation', async () => {
    // Navigate to START tab
    await element(by.text('START')).tap();
    
    // Open modal
    await element(by.id('voice-fab')).tap();
    
    // Type command
    await element(by.id('voice-input')).typeText('bench press 225 for 10');
    
    // Verify text entered
    await detoxExpect(element(by.id('voice-input'))).toHaveText('bench press 225 for 10');
  });

  it('should show parse button', async () => {
    // Navigate to START tab
    await element(by.text('START')).tap();
    
    // Open modal
    await element(by.id('voice-fab')).tap();
    
    // Verify parse button exists
    await detoxExpect(element(by.id('log-set-button'))).toBeVisible();
  });

  // Note: Testing actual voice recognition requires physical device
  // and cannot be fully automated. Manual testing required for:
  // - Microphone permission prompt
  // - Speech recognition accuracy
  // - Voice command parsing
  // - Haptic feedback
});

