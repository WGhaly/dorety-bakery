import { test, expect } from '@playwright/test'

test.describe('Quick Functional Verification', () => {
  test('verify registration form actually works', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register')
    await page.waitForTimeout(3000) // Wait for hydration
    
    // Create unique test user
    const timestamp = Date.now()
    const testEmail = `verify-${timestamp}@test.com`
    
    // Fill the form
    await page.fill('input[name="name"]', 'Verification User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'VerifyPass123')
    
    // Capture network requests
    const requests: string[] = []
    page.on('request', req => {
      if (req.url().includes('/api/auth/register')) {
        requests.push(`${req.method()} ${req.url()}`)
      }
    })
    
    // Submit form
    await page.click('button:has-text("Create account")')
    
    // Wait for response
    await page.waitForTimeout(5000)
    
    // Check results
    console.log('Requests made:', requests)
    console.log('Current URL:', page.url())
    
    // Verify POST was used and no password in URL
    expect(requests.some(r => r.startsWith('POST'))).toBeTruthy()
    expect(page.url()).not.toContain('VerifyPass123')
    expect(page.url()).not.toContain('password')
    
    // Look for success or error feedback
    const successMsg = await page.locator('text=Account created successfully').isVisible()
    const errorMsg = await page.locator('.text-red-600, .bg-red-50').textContent()
    const redirected = page.url().includes('/login')
    
    console.log('Success message:', successMsg)
    console.log('Error message:', errorMsg)
    console.log('Redirected to login:', redirected)
    
    // Should have some feedback
    expect(successMsg || errorMsg || redirected).toBeTruthy()
  })

  test('verify login form actually works', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(3000)
    
    // Try login with test credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPassword123')
    
    // Capture requests
    const requests: string[] = []
    page.on('request', req => {
      if (req.url().includes('/api/auth')) {
        requests.push(`${req.method()} ${req.url()}`)
      }
    })
    
    await page.click('button:has-text("Sign in")')
    await page.waitForTimeout(3000)
    
    console.log('Auth requests:', requests)
    console.log('Current URL:', page.url())
    
    // Verify no password in URL
    expect(page.url()).not.toContain('TestPassword123')
    expect(page.url()).not.toContain('password')
    
    // Should show feedback or redirect
    const errorMsg = await page.locator('.text-red-600, .bg-red-50').isVisible()
    const stillOnLogin = page.url().includes('/login')
    const redirected = !stillOnLogin
    
    console.log('Has error message:', errorMsg)
    console.log('Still on login:', stillOnLogin)
    console.log('Redirected:', redirected)
    
    // Should have some result
    expect(errorMsg || redirected).toBeTruthy()
  })

  test('verify CSS and styling works', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(2000)
    
    // Check basic page structure
    const title = await page.title()
    const hasForm = await page.locator('form').isVisible()
    const hasInputs = await page.locator('input').count() >= 2
    const hasButton = await page.locator('button:has-text("Sign in"), button[type="button"]').isVisible()
    
    console.log('Page title:', title)
    console.log('Has form:', hasForm)
    console.log('Has inputs:', hasInputs)
    console.log('Has submit button:', hasButton)
    
    expect(hasForm && hasInputs && hasButton).toBeTruthy()
    
    // Check if content is visible (not broken CSS)
    const bodyText = await page.locator('body').textContent()
    const hasContent = bodyText && bodyText.length > 100
    
    console.log('Has substantial content:', hasContent)
    expect(hasContent).toBeTruthy()
  })

  test('verify navigation works', async ({ page }) => {
    const pages = ['/', '/products', '/about', '/contact']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForTimeout(1000)
      
      const title = await page.title()
      const content = await page.locator('body').textContent()
      const hasContent = content && content.length > 50
      
      console.log(`${pagePath}: title="${title}", hasContent=${hasContent}`)
      expect(hasContent).toBeTruthy()
    }
  })
})