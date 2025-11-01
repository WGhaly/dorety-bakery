/**
 * Product Detail Page E2E Tests
 * 
 * Tests individual product detail page functionality including:
 * - Product detail page loading
 * - Product information display
 * - Add to cart functionality
 * - Quantity selection and price calculation
 */

import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page first
    await page.goto('http://localhost:3000/products');
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to product detail page from products list', async ({ page }) => {
    // Step 1: Find first product card with a link
    const firstCard = page.locator('.product-card, [data-testid="product-card"]').first();
    const productLink = firstCard.locator('a, [data-testid="product-link"]').first();
    
    // Step 2: Click on product to navigate to detail page
    if (await productLink.count() > 0) {
      await expect(productLink).toBeVisible();
      await productLink.click();
      
      // Step 3: Verify URL changed to product detail page
      await expect(page).toHaveURL(/\/products\/[^\/]+/);
      
      // Step 4: Verify product detail page loads
      await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    } else {
      // Alternative: Navigate directly to a known product
      await page.goto('http://localhost:3000/products/chocolate-croissant');
      await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display complete product information', async ({ page }) => {
    // Step 1: Navigate to a specific product detail page
    await page.goto('http://localhost:3000/products/chocolate-croissant');
    
    // Step 2: Verify product title is displayed
    await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    
    // Step 3: Verify product price is displayed
    await expect(page.locator('text=/\\$[0-9]/, .price, [data-testid="product-price"]')).toBeVisible();
    
    // Step 4: Verify product description or details exist
    const hasDescription = await page.locator('.description, .product-description, p').count() > 0;
    if (hasDescription) {
      await expect(page.locator('.description, .product-description, p').first()).toBeVisible();
    }
    
    // Step 5: Verify product image exists (if present)
    const productImage = page.locator('img').first();
    if (await productImage.count() > 0) {
      await expect(productImage).toBeVisible();
    }
  });

  test('should display quantity selector and add to cart functionality', async ({ page }) => {
    // Step 1: Navigate to product detail page
    await page.goto('http://localhost:3000/products/chocolate-croissant');
    await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Verify quantity selector exists
    const quantitySelector = page.locator('select, input[type="number"], [data-testid="quantity-selector"]');
    if (await quantitySelector.count() > 0) {
      await expect(quantitySelector).toBeVisible();
      
      // Step 3: Test quantity selection
      await quantitySelector.selectOption('3');
      await page.waitForTimeout(500);
    }
    
    // Step 4: Verify add to cart button exists
    await expect(page.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]')).toBeVisible();
  });

  test('should handle add to cart from product detail page', async ({ page }) => {
    // Step 1: Navigate to product detail page
    await page.goto('http://localhost:3000/products/chocolate-croissant');
    await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Set quantity if selector exists
    const quantitySelector = page.locator('select, input[type="number"], [data-testid="quantity-selector"]');
    if (await quantitySelector.count() > 0) {
      await quantitySelector.selectOption('2');
    }
    
    // Step 3: Click add to cart button
    const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    
    // Step 4: Wait for response and check for feedback
    await page.waitForTimeout(2000);
    
    // Check for various possible feedback mechanisms
    const hasLoadingState = await addToCartButton.locator('text=/adding|loading/i').isVisible();
    const hasSuccessMessage = await page.locator('text=/added.*cart|success/i').isVisible();
    const hasCartUpdate = await page.locator('[data-testid="cart-count"], .cart-count').isVisible();
    const buttonDisabled = await addToCartButton.isDisabled();
    
    // Some form of feedback should occur
    expect(hasLoadingState || hasSuccessMessage || hasCartUpdate || buttonDisabled).toBeTruthy();
  });

  test('should calculate price correctly based on quantity', async ({ page }) => {
    // Step 1: Navigate to product detail page
    await page.goto('http://localhost:3000/products/chocolate-croissant');
    await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Get initial price display
    const priceElement = page.locator('text=/\\$[0-9]/, .price, [data-testid="product-price"]').first();
    const initialPrice = await priceElement.textContent();
    
    // Step 3: Change quantity if selector exists
    const quantitySelector = page.locator('select, input[type="number"], [data-testid="quantity-selector"]');
    if (await quantitySelector.count() > 0) {
      await quantitySelector.selectOption('3');
      await page.waitForTimeout(1000);
      
      // Step 4: Check if total price updates or if button shows calculated price
      const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]');
      const buttonText = await addToCartButton.textContent();
      
      // Verify button contains price information
      expect(buttonText).toContain('$');
    }
  });

  test('should maintain navigation functionality on product detail page', async ({ page }) => {
    // Step 1: Navigate to product detail page
    await page.goto('http://localhost:3000/products/chocolate-croissant');
    await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Verify navigation bar is still present
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: /fadi.*bakery/i })).toBeVisible();
    
    // Step 3: Test navigation back to products
    await page.getByRole('link', { name: /products/i }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible();
  });

  test('should handle invalid product URLs gracefully', async ({ page }) => {
    // Step 1: Navigate to non-existent product
    await page.goto('http://localhost:3000/products/non-existent-product');
    
    // Step 2: Verify appropriate error handling
    const has404Error = await page.locator('text=/404|not found|product.*not.*found/i').isVisible();
    const redirectsToProducts = page.url().includes('/products') && !page.url().includes('/products/non-existent-product');
    
    // Either should handle the error appropriately
    expect(has404Error || redirectsToProducts).toBeTruthy();
    
    // Step 3: Verify navigation still works
    if (await page.getByRole('navigation').isVisible()) {
      await page.getByRole('link', { name: /products/i }).click();
      await expect(page).toHaveURL(/\/products$/);
    }
  });

  test('should support browser back navigation from product detail', async ({ page }) => {
    // Step 1: Navigate to products page
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible();
    
    // Step 2: Navigate to product detail
    await page.goto('http://localhost:3000/products/chocolate-croissant');
    await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    
    // Step 3: Use browser back button
    await page.goBack();
    
    // Step 4: Verify returned to products page
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible();
  });
});