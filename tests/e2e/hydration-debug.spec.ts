import { test, expect } from '@playwright/test'

test.describe('Hydration Debug', () => {
  test('check react hydration status and form behavior', async ({ page }) => {
    test.setTimeout(30000) // 30 second timeout
    // Enable console logging
    page.on('console', msg => {
      console.log(`BROWSER: ${msg.type()}: ${msg.text()}`)
    })

    page.on('pageerror', error => {
      console.error(`PAGE ERROR: ${error}`)
    })

    await page.goto('http://localhost:3000/register')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if React is hydrated
    const reactHydratedStatus = await page.evaluate(() => {
      // Check if React is available
      const reactAvailable = typeof window !== 'undefined' && 
                            (window as any).React !== undefined ||
                            document.querySelector('[data-reactroot]') !== null ||
                            document.querySelector('script[src*="react"]') !== null

      // Check if page is hydrated by looking for React fiber
      const isHydrated = document.querySelector('#__next') !== null && 
                        document.querySelector('#__next')?.hasAttribute('data-reactroot')

      // Alternative hydration check
      const hasReactFiber = document.querySelector('[data-react-helmet]') !== null ||
                           document.querySelector('[data-reactroot]') !== null ||
                           (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined

      return {
        reactAvailable,
        isHydrated,
        hasReactFiber,
        hasReactDevtools: (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined,
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('react')),
        nextJsData: (window as any).__NEXT_DATA__ !== undefined
      }
    })

    console.log('React Hydration Status:', reactHydratedStatus)

    // Check form element details
    const formDetails = await page.evaluate(() => {
      const form = document.querySelector('form')
      const submitButton = document.querySelector('button[type="submit"]')
      const nameInput = document.querySelector('input[name="name"]')
      
      return {
        formExists: form !== null,
        formMethod: form?.getAttribute('method') || 'default',
        formAction: form?.getAttribute('action') || 'none',
        formOnSubmit: form?.getAttribute('onsubmit') || 'none',
        formEventListeners: form ? (form as any)._reactInternalFiber !== undefined : false,
        submitButtonExists: submitButton !== null,
        nameInputExists: nameInput !== null,
        nameInputValue: nameInput ? (nameInput as HTMLInputElement).value : 'none'
      }
    })

    console.log('Form Details:', formDetails)

    // Try to trigger form submission and see what happens
    const uniqueEmail = `test-${Date.now()}@example.com`
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', 'TestPassword123')

    // Check if filling worked
    const inputValues = await page.evaluate(() => {
      return {
        name: (document.querySelector('input[name="name"]') as HTMLInputElement)?.value,
        email: (document.querySelector('input[name="email"]') as HTMLInputElement)?.value,
        password: (document.querySelector('input[name="password"]') as HTMLInputElement)?.value
      }
    })

    console.log('Input Values After Fill:', inputValues)

    // Set up network request monitoring
    const requests: any[] = []
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      })
    })

    // Click submit button
    await page.click('button[type="submit"]')
    
    // Wait a bit to see what happens
    await page.waitForTimeout(1000)

    const currentUrl = page.url()
    console.log('Current URL after submit:', currentUrl)
    console.log('Network requests made:', requests.filter(r => r.url.includes('api') || r.url.includes('register')))

    // Basic check - just verify it's not submitting via GET with password in URL
    if (currentUrl.includes('password=')) {
      console.log('🚨 CRITICAL: Password found in URL! Form is submitting via GET instead of POST')
      console.log('This means React Hook Form is not working - hydration failure!')
    }
    
    // Log auth requests
    const authRequests = requests.filter(r => r.url.includes('/api/auth'))
    console.log('Auth API requests:', authRequests)
  })
})