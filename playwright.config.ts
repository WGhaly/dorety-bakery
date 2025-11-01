import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Dorety Bakery E2E Tests
 * 
 * Optimized for fast, reliable testing with human-like interactions
 * Updated to handle React hydration issues
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Shorter timeouts for faster feedback due to hydration issues
  timeout: 15000,
  expect: {
    timeout: 3000
  },
  
  // Run sequentially to avoid conflicts during hydration issues
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  
  // Global test settings
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',
    
    // Browser settings optimized for React hydration issues
    headless: true,
    viewport: { width: 1280, height: 720 },
    
    // Reduced timeouts for faster failure detection
    actionTimeout: 5000,
    navigationTimeout: 10000,
    
    // Screenshots and traces on failure
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off', // Disable video to speed up tests
    
    // Human-like interaction settings
    launchOptions: {
      slowMo: 0, // No delay for faster execution
    }
  },

  // Single browser project for faster execution
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  // Development server configuration (with TURBOPACK=0 to avoid hydration issues)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  
  // Output directory
  outputDir: 'test-results/',
});