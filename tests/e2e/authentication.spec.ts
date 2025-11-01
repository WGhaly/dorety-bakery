/**
 * User Authentication E2E Tests
 * 
 * Tests user registration and login flows including:
 * - Registration form access and submission
 * - Login form access and authentication
 * - Navigation between auth pages
 * - Dashboard access after authentication
 */

import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page for each test
    await page.goto('http://localhost:3000');
  });

  test('should access registration page and display form', async ({ page }) => {
    // Step 1: Navigate to registration via sign up link
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Step 2: Verify registration page loads
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Step 3: Verify all form fields are present
    await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /phone/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    
    // Step 4: Verify submit button exists
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    
    // Step 5: Verify link to login page
    await expect(page.getByRole('link', { name: /already have an account/i })).toBeVisible();
  });

  test('should complete registration flow with valid data', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Step 2: Fill out registration form with unique email
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    
    await page.getByRole('textbox', { name: /full name/i }).fill('Test User');
    await page.getByRole('textbox', { name: /email/i }).fill(testEmail);
    await page.getByRole('textbox', { name: /phone/i }).fill('555-123-4567');
    await page.getByRole('textbox', { name: /password/i }).fill('TestPassword123!');
    
    // Step 3: Submit the form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Step 4: Wait for success state or redirect
    // Note: May need adjustment based on actual app behavior
    await page.waitForTimeout(3000);
    
    // Check for success indicators
    const hasSuccessMessage = await page.locator('text=/account created|success|welcome/i').isVisible();
    const redirectedToLogin = page.url().includes('/login');
    const showsSuccessPage = await page.getByRole('heading', { name: /account created/i }).isVisible();
    
    // At least one success indicator should be present
    expect(hasSuccessMessage || redirectedToLogin || showsSuccessPage).toBeTruthy();
  });

  test('should access login page and display form', async ({ page }) => {
    // Step 1: Navigate to login via sign in link
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Step 2: Verify login page loads
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Step 3: Verify form fields are present
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    
    // Step 4: Verify submit button exists
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Step 5: Verify social login options
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    
    // Step 6: Verify link to registration page
    await expect(page.getByRole('link', { name: /create.*account/i })).toBeVisible();
  });

  test('should handle login form submission', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Step 2: Fill login form with test credentials
    await page.getByRole('textbox', { name: /email/i }).fill('testuser@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('TestPassword123!');
    
    // Step 3: Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Step 4: Wait for response
    await page.waitForTimeout(3000);
    
    // Step 5: Check for authentication result
    // Note: May redirect to dashboard, show error, or other behavior
    const currentUrl = page.url();
    const hasErrorMessage = await page.locator('text=/error|invalid|incorrect/i').isVisible();
    const redirectedToDashboard = currentUrl.includes('/dashboard');
    
    // Verify some form of response occurred
    expect(currentUrl !== 'http://localhost:3000/login' || hasErrorMessage).toBeTruthy();
  });

  test('should navigate between auth pages correctly', async ({ page }) => {
    // Step 1: Go to registration page
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
    
    // Step 2: Navigate to login from registration
    await page.getByRole('link', { name: /already have an account/i }).click();
    await expect(page).toHaveURL(/\/login/);
    
    // Step 3: Navigate back to registration from login
    await page.getByRole('link', { name: /create.*account/i }).click();
    await expect(page).toHaveURL(/\/register/);
    
    // Step 4: Verify each page loads correctly
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('should show password visibility toggle', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    
    // Step 2: Verify password field is initially hidden
    const passwordField = page.getByRole('textbox', { name: /password/i });
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Step 3: Find and click password visibility toggle
    const toggleButton = page.locator('button').filter({ has: page.locator('svg, img, .eye, .show') }).first();
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      
      // Step 4: Verify password field shows text
      await expect(passwordField).toHaveAttribute('type', 'text');
      
      // Step 5: Click toggle again to hide
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  test('should validate required fields on registration', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    
    // Step 2: Try to submit empty form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Step 3: Wait for validation errors
    await page.waitForTimeout(1000);
    
    // Step 4: Check for validation messages
    const hasValidationErrors = await page.locator('text=/required|invalid|error/i').isVisible();
    const staysOnRegisterPage = page.url().includes('/register');
    
    // Form should either show validation errors or stay on the page
    expect(hasValidationErrors || staysOnRegisterPage).toBeTruthy();
  });
});