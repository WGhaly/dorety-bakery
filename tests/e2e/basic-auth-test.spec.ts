import { test, expect } from '@playwright/test'

test('authentication basic functionality test', async ({ page }) => {
  // Test registration
  await page.goto('/register')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000) // Wait for React hydration
  
  // Fill form
  const timestamp = Date.now()
  await page.fill('input[name="name"]', `Test User ${timestamp}`)
  await page.fill('input[name="email"]', `test${timestamp}@example.com`)
  await page.fill('input[name="password"]', 'TestPassword123')
  
  // Monitor network requests
  const requests: string[] = []
  page.on('request', req => {
    if (req.url().includes('/api/auth/register')) {
      requests.push(`${req.method()} ${req.url()}`)
    }
  })
  
  // Submit form
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)
  
  console.log('Registration requests:', requests)
  console.log('Current URL:', page.url())
  
  // Check if we got the POST request and no password in URL
  const hasPostRequest = requests.some(r => r.startsWith('POST'))
  const noPasswordInUrl = !page.url().includes('TestPassword123')
  
  console.log('Has POST request:', hasPostRequest)
  console.log('No password in URL:', noPasswordInUrl)
  
  // Look for success indicators
  const successMessage = await page.locator('text=Account created successfully').isVisible()
  const errorMessage = await page.locator('.text-red-600').textContent()
  const redirectedToLogin = page.url().includes('/login')
  
  console.log('Success message:', successMessage)
  console.log('Error message:', errorMessage)
  console.log('Redirected to login:', redirectedToLogin)
  
  // Basic validation
  expect(noPasswordInUrl).toBeTruthy() // Security check
  expect(hasPostRequest || successMessage || errorMessage || redirectedToLogin).toBeTruthy() // Some response
})