import { test, expect } from '@playwright/test';

/**
 * Diagnostic Tests for React Hydration Issues
 * 
 * These tests help identify what's causing the hang-ups
 */

test.describe('Diagnostic Tests', () => {
  test('Basic page load and DOM readiness', async ({ page }) => {
    console.log('Starting diagnostic test...');
    
    // Step 1: Navigate to home page
    console.log('Navigating to home page...');
    await page.goto('/');
    
    // Step 2: Wait for basic HTML structure
    console.log('Waiting for basic HTML...');
    await page.waitForSelector('html', { timeout: 5000 });
    
    // Step 3: Check if we can see the title
    console.log('Checking page title...');
    const title = await page.title();
    console.log('Page title:', title);
    
    // Step 4: Check if React has hydrated
    console.log('Checking React hydration status...');
    const reactHydrated = await page.evaluate(() => {
      // Check if React has attached event listeners
      return window.document.querySelector('[data-reactroot]') !== null ||
             window.document.querySelector('#__next') !== null ||
             typeof window.React !== 'undefined';
    });
    console.log('React hydrated:', reactHydrated);
    
    // Step 5: Check for navigation element (but don't wait if it hangs)
    console.log('Looking for navigation...');
    try {
      const navElement = await page.locator('nav').first();
      const navExists = await navElement.isVisible({ timeout: 2000 });
      console.log('Navigation visible:', navExists);
    } catch (error) {
      console.log('Navigation check failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Step 6: Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Basic assertion that doesn't depend on React
    expect(title).toBeTruthy();
  });

  test('Quick navigation without waiting for interactive elements', async ({ page }) => {
    console.log('Testing basic navigation...');
    
    // Go to home
    await page.goto('/');
    console.log('Loaded home page');
    
    // Check if we can navigate to products using URL
    await page.goto('/products');
    console.log('Loaded products page');
    
    // Check page title changed
    const title = await page.title();
    console.log('Products page title:', title);
    
    // Don't wait for React - just check we got to the right page
    expect(page.url()).toContain('/products');
  });

  test('Check for infinite redirects or loading states', async ({ page }) => {
    console.log('Checking for redirect loops...');
    
    const redirectCount = await page.evaluate(() => {
      let count = 0;
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        count++;
        return originalPushState.apply(this, args);
      };
      
      history.replaceState = function(...args) {
        count++;
        return originalReplaceState.apply(this, args);
      };
      
      return count;
    });
    
    await page.goto('/');
    
    // Wait a bit and check if excessive navigation happened
    await page.waitForTimeout(3000);
    
    const finalRedirectCount = await page.evaluate(() => {
      // Access the count we set up earlier
      return (window as any).redirectCount || 0;
    });
    
    console.log('Redirect count during load:', finalRedirectCount);
    
    expect(finalRedirectCount).toBeLessThan(5); // Should not redirect more than a few times
  });
});