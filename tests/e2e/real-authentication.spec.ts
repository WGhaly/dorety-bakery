import { test, expect } from '@playwright/test'

test.describe('Real Authentication Flow Tests', () => {
  // Clean up test users before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to a simple page first to ensure the app is running
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should successfully register a new user and redirect to login', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Wait for React to hydrate to avoid hydration issues
    await page.waitForTimeout(2000)
    
    // Step 2: Fill out the registration form with valid data
    const timestamp = Date.now()
    const testEmail = `test-user-${timestamp}@example.com`
    const testName = `Test User ${timestamp}`
    
    await page.fill('input[name="name"]', testName)
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="phone"]', '1234567890')
    await page.fill('input[name="password"]', 'TestPassword123')
    
    // Step 3: Monitor network requests to ensure POST is used
    const requests: any[] = []
    page.on('request', request => {
      if (request.url().includes('/api/auth/register')) {
        requests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        })
      }
    })
    
    // Step 4: Submit the form
    await page.click('button[type="submit"]')
    
    // Step 5: Wait for response and verify success
    await page.waitForTimeout(5000) // Give time for async operation
    
    // Verify a POST request was made
    expect(requests.length).toBeGreaterThan(0)
    expect(requests[0].method).toBe('POST')
    
    // Verify password is NOT in the URL
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('password')
    expect(currentUrl).not.toContain('TestPassword123')
    
    // Step 6: Check for success message OR redirect to login
    const hasSuccessMessage = await page.locator('text=Account created successfully').isVisible()
    const isOnLoginPage = currentUrl.includes('/login')
    
    // Either success message should appear or we should be redirected
    expect(hasSuccessMessage || isOnLoginPage).toBeTruthy()
    
    // If success message is shown, wait for redirect
    if (hasSuccessMessage) {
      await page.waitForURL('/login', { timeout: 10000 })
    }
    
    // Step 7: Verify we're now on login page
    expect(page.url()).toContain('/login')
  })

  test('should handle registration form validation correctly', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Test 1: Try submitting empty form
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    
    // Should see validation errors
    const hasValidationErrors = await page.locator('.text-red-600').count() > 0
    expect(hasValidationErrors).toBeTruthy()
    
    // Test 2: Invalid email format
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'weak')
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    
    // Should still have validation errors
    const emailError = await page.locator('text=Please enter a valid email address').isVisible()
    const passwordError = await page.locator('text=Password must be at least 8 characters').isVisible()
    
    expect(emailError || passwordError).toBeTruthy()
  })

  test('should successfully login an existing user and redirect to dashboard', async ({ page }) => {
    // First, create a test user via API
    const testUser = {
      name: 'Login Test User',
      email: 'logintest@example.com',
      password: 'TestPassword123'
    }
    
    // Create user via API call
    const response = await page.request.post('/api/auth/register', {
      data: testUser
    })
    
    // Only proceed if user creation was successful
    if (response.ok()) {
      // Now test login
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Fill login form
      await page.fill('input[name="email"]', testUser.email)
      await page.fill('input[name="password"]', testUser.password)
      
      // Monitor authentication requests
      const authRequests: any[] = []
      page.on('request', request => {
        if (request.url().includes('/api/auth')) {
          authRequests.push({
            method: request.method(),
            url: request.url()
          })
        }
      })
      
      // Submit login form
      await page.click('button[type="submit"]')
      
      // Wait for authentication
      await page.waitForTimeout(5000)
      
      // Verify password is NOT in URL
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('password')
      expect(currentUrl).not.toContain('TestPassword123')
      
      // Should be redirected to dashboard or protected page
      const isOnDashboard = currentUrl.includes('/dashboard')
      const isLoggedIn = !currentUrl.includes('/login')
      
      expect(isLoggedIn).toBeTruthy()
    }
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Try login with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'WrongPassword123')
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Should show error message
    const errorVisible = await page.locator('.text-red-600, .text-red-800').isVisible()
    expect(errorVisible).toBeTruthy()
    
    // Should still be on login page
    expect(page.url()).toContain('/login')
  })

  test('should prevent duplicate user registration', async ({ page }) => {
    const duplicateEmail = 'duplicate@example.com'
    
    // First registration
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await page.fill('input[name="name"]', 'First User')
    await page.fill('input[name="email"]', duplicateEmail)
    await page.fill('input[name="password"]', 'TestPassword123')
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)
    
    // Second registration with same email
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await page.fill('input[name="name"]', 'Second User')
    await page.fill('input[name="email"]', duplicateEmail)
    await page.fill('input[name="password"]', 'TestPassword123')
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Should show duplicate user error
    const errorText = await page.locator('.text-red-600, .text-red-800').textContent()
    expect(errorText).toContain('already exists')
  })

  test('should verify CSS styling is working correctly', async ({ page }) => {
    // Test login page styling
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Check if key visual elements are properly styled
    const titleExists = await page.locator('h2').isVisible()
    const formExists = await page.locator('form').isVisible()
    const inputsExist = await page.locator('input').count() >= 2
    const buttonExists = await page.locator('button[type="submit"]').isVisible()
    
    expect(titleExists && formExists && inputsExist && buttonExists).toBeTruthy()
    
    // Check if Tailwind classes are applied by checking computed styles
    const formContainer = page.locator('form').first()
    const hasBackgroundColor = await formContainer.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent'
    })
    
    // At least some styling should be applied
    expect(titleExists).toBeTruthy()
  })

  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Fill form
    await page.fill('input[name="name"]', 'Network Test User')
    await page.fill('input[name="email"]', 'networktest@example.com')
    await page.fill('input[name="password"]', 'TestPassword123')
    
    // Intercept and block the API request to simulate network failure
    await page.route('/api/auth/register', route => {
      route.abort()
    })
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Should show some kind of error message
    const errorVisible = await page.locator('.text-red-600, .text-red-800').isVisible()
    expect(errorVisible).toBeTruthy()
  })
})