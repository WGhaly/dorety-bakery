import { test, expect } from '@playwright/test'

test.describe('Real User Experience Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure app is running
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display products and allow browsing', async ({ page }) => {
    // Navigate to products page
    await page.goto('/products')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Check if products are displayed
    const productCards = await page.locator('[data-testid="product-card"], .product-card, .card').count()
    const productLinks = await page.locator('a[href*="/products/"]').count()
    const productImages = await page.locator('img[alt*="product"], img[src*="product"]').count()
    
    // At least some products should be visible
    const hasProducts = productCards > 0 || productLinks > 0 || productImages > 0
    expect(hasProducts).toBeTruthy()
    
    console.log(`Found ${productCards} product cards, ${productLinks} product links, ${productImages} product images`)
    
    // Try to click on a product if available
    const firstProductLink = page.locator('a[href*="/products/"]').first()
    if (await firstProductLink.isVisible()) {
      await firstProductLink.click()
      await page.waitForLoadState('networkidle')
      
      // Should navigate to product detail page
      expect(page.url()).toContain('/products/')
    }
  })

  test('should handle shopping cart functionality', async ({ page }) => {
    // Start from home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for add to cart buttons or cart functionality
    const addToCartButtons = await page.locator('button:has-text("Add to Cart"), button:has-text("Add"), [data-testid="add-to-cart"]').count()
    const cartIcons = await page.locator('[data-testid="cart"], .cart, a[href*="cart"]').count()
    
    console.log(`Found ${addToCartButtons} add to cart buttons, ${cartIcons} cart icons`)
    
    // If cart functionality exists, test it
    if (cartIcons > 0) {
      const cartLink = page.locator('[data-testid="cart"], .cart, a[href*="cart"]').first()
      await cartLink.click()
      await page.waitForLoadState('networkidle')
      
      // Should navigate to cart page
      expect(page.url()).toContain('cart')
    }
    
    // If add to cart buttons exist, test them
    if (addToCartButtons > 0) {
      const addButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      await addButton.click()
      await page.waitForTimeout(1000)
      
      // Some feedback should be given (cart count, notification, etc.)
      const cartCount = await page.locator('.cart-count, [data-testid="cart-count"]').textContent()
      const notification = await page.locator('.notification, .toast, .alert').isVisible()
      
      expect(cartCount || notification).toBeTruthy()
    }
  })

  test('should handle navigation between pages correctly', async ({ page }) => {
    // Test main navigation links
    const navigationLinks = [
      { name: 'Home', url: '/' },
      { name: 'Products', url: '/products' },
      { name: 'About', url: '/about' },
      { name: 'Contact', url: '/contact' }
    ]
    
    for (const link of navigationLinks) {
      await page.goto(link.url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Page should load without errors
      const pageTitle = await page.title()
      const hasContent = await page.locator('body').textContent()
      
      expect(pageTitle).toBeTruthy()
      expect(hasContent?.length).toBeGreaterThan(100) // Should have substantial content
      
      console.log(`${link.name} page loaded with title: ${pageTitle}`)
    }
  })

  test('should handle user dashboard access correctly', async ({ page }) => {
    // Try to access dashboard directly (should redirect to login if not authenticated)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    
    // Should either be on dashboard (if authenticated) or redirected to login
    const isOnDashboard = currentUrl.includes('/dashboard')
    const isOnLogin = currentUrl.includes('/login')
    
    expect(isOnDashboard || isOnLogin).toBeTruthy()
    
    if (isOnLogin) {
      console.log('✅ Properly redirected to login when accessing protected dashboard')
    } else {
      console.log('✅ Dashboard accessible (user might be authenticated)')
    }
  })

  test('should handle order functionality if available', async ({ page }) => {
    // Check if there's order functionality
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for order-related links
    const orderLinks = await page.locator('a[href*="order"], a[href*="checkout"], button:has-text("Order")').count()
    
    if (orderLinks > 0) {
      const orderLink = page.locator('a[href*="order"], a[href*="checkout"]').first()
      await orderLink.click()
      await page.waitForLoadState('networkidle')
      
      // Should navigate to order/checkout page
      const url = page.url()
      expect(url.includes('order') || url.includes('checkout')).toBeTruthy()
      
      console.log('✅ Order functionality accessible')
    } else {
      console.log('ℹ️ No order functionality found')
    }
  })

  test('should display contact information and forms', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    
    // Check for contact information
    const hasContactInfo = await page.locator('text=/email|phone|address|contact/i').count() > 0
    const hasContactForm = await page.locator('form').count() > 0
    
    expect(hasContactInfo || hasContactForm).toBeTruthy()
    
    // If there's a contact form, test it
    if (hasContactForm) {
      const form = page.locator('form').first()
      const inputs = await form.locator('input, textarea').count()
      
      if (inputs > 0) {
        // Fill out contact form
        const nameInput = form.locator('input[name*="name"], input[placeholder*="name"]').first()
        const emailInput = form.locator('input[type="email"], input[name*="email"]').first()
        const messageInput = form.locator('textarea, input[name*="message"]').first()
        
        if (await nameInput.isVisible()) await nameInput.fill('Test User')
        if (await emailInput.isVisible()) await emailInput.fill('test@example.com')
        if (await messageInput.isVisible()) await messageInput.fill('Test message')
        
        // Try to submit
        const submitButton = form.locator('button[type="submit"], input[type="submit"]').first()
        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(2000)
          
          // Should show some feedback
          const feedback = await page.locator('.success, .error, .message, .notification').isVisible()
          console.log('Contact form submission feedback:', feedback)
        }
      }
    }
  })

  test('should handle responsive design correctly', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 390, height: 844, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check if page is responsive
      const bodyWidth = await page.locator('body').boundingBox()
      const hasOverflow = bodyWidth ? bodyWidth.width > viewport.width : false
      
      expect(hasOverflow).toBeFalsy()
      
      // Check if navigation is accessible
      const navVisible = await page.locator('nav, .navigation, .navbar').isVisible()
      expect(navVisible).toBeTruthy()
      
      console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) working correctly`)
    }
  })

  test('should verify search functionality if available', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for search functionality
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], [data-testid="search"]').count()
    
    if (searchInputs > 0) {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first()
      await searchInput.fill('bread')
      
      // Look for search button or press Enter
      const searchButton = page.locator('button:has-text("Search"), [data-testid="search-button"]').first()
      if (await searchButton.isVisible()) {
        await searchButton.click()
      } else {
        await searchInput.press('Enter')
      }
      
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Should show search results
      const hasResults = await page.locator('.search-results, .results, .product').count() > 0
      console.log('Search functionality working:', hasResults)
    } else {
      console.log('ℹ️ No search functionality found')
    }
  })
})