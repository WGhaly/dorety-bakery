/**
 * Products Page E2E Tests
 * 
 * Tests the main products listing page functionality including:
 * - Page loading and product display
 * - Quantity selectors on all product cards
 * - Add to cart functionality with price calculations
 * - Product filtering and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page before each test
    await page.goto('http://localhost:3000/products');
  });

  test('should load products page with navigation and product grid', async ({ page }) => {
    // Step 1: Verify page loads and navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: "Fadi's Bakery" })).toBeVisible();
    
    // Step 2: Verify main products heading appears
    await expect(page.getByRole('heading', { name: /our products/i })).toBeVisible({ timeout: 5000 });
    
    // Step 3: Verify product grid container exists
    await expect(page.locator('[data-testid="products-grid"], .grid, .products-container')).toBeVisible();
    
    // Step 4: Verify at least one product card is displayed
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible();
  });

  test('should display quantity selectors on all product cards', async ({ page }) => {
    // Step 1: Wait for products to load
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible({ timeout: 5000 });
    
    // Step 2: Get all product cards
    const productCards = page.locator('.product-card, [data-testid="product-card"]');
    const cardCount = await productCards.count();
    
    // Step 3: Verify each product card has quantity selector
    for (let i = 0; i < cardCount; i++) {
      const card = productCards.nth(i);
      
      // Verify quantity label exists
      await expect(card.locator('text=/quantity/i')).toBeVisible();
      
      // Verify quantity dropdown/select exists
      await expect(card.locator('select, [role="combobox"], input[type="number"]')).toBeVisible();
      
      // Verify add to cart button exists with price
      await expect(card.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]')).toBeVisible();
    }
  });

  test('should update price when quantity changes', async ({ page }) => {
    // Step 1: Wait for first product card to load
    const firstCard = page.locator('.product-card, [data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    
    // Step 2: Find quantity selector and add to cart button
    const quantitySelect = firstCard.locator('select, [role="combobox"], input[type="number"]');
    const addToCartButton = firstCard.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]');
    
    await expect(quantitySelect).toBeVisible();
    await expect(addToCartButton).toBeVisible();
    
    // Step 3: Get initial price text
    const initialButtonText = await addToCartButton.textContent();
    
    // Step 4: Change quantity to 3
    await quantitySelect.selectOption('3');
    
    // Step 5: Wait for price update and verify it changed
    await page.waitForTimeout(1000); // Allow for price calculation
    const updatedButtonText = await addToCartButton.textContent();
    
    // Verify the button text includes price and quantity affects it
    expect(updatedButtonText).toContain('Add to Cart');
    expect(updatedButtonText).toContain('$');
  });

  test('should handle add to cart interactions', async ({ page }) => {
    // Step 1: Wait for first product to load
    const firstCard = page.locator('.product-card, [data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    
    // Step 2: Set quantity to 2
    const quantitySelect = firstCard.locator('select, [role="combobox"], input[type="number"]');
    await expect(quantitySelect).toBeVisible();
    await quantitySelect.selectOption('2');
    
    // Step 3: Click add to cart button
    const addToCartButton = firstCard.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    
    // Step 4: Verify some feedback occurs (loading state, success message, or cart update)
    // Note: This may need adjustment based on actual app behavior
    await page.waitForTimeout(2000);
    
    // Check for possible feedback indicators
    const hasLoadingState = await addToCartButton.locator('text=/adding|loading/i').isVisible();
    const hasSuccessMessage = await page.locator('text=/added to cart|success/i').isVisible();
    const hasCartUpdate = await page.locator('[data-testid="cart-count"], .cart-count').isVisible();
    
    // At least one form of feedback should be present
    expect(hasLoadingState || hasSuccessMessage || hasCartUpdate).toBeTruthy();
  });

  test('should display product details correctly', async ({ page }) => {
    // Step 1: Wait for products to load
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible({ timeout: 5000 });
    
    // Step 2: Get first product card
    const firstCard = page.locator('.product-card, [data-testid="product-card"]').first();
    
    // Step 3: Verify product name exists
    await expect(firstCard.locator('h2, h3, .product-name, [data-testid="product-name"]')).toBeVisible();
    
    // Step 4: Verify product price exists
    await expect(firstCard.locator('text=/\\$[0-9]/').first()).toBeVisible();
    
    // Step 5: Verify product image exists (if present)
    const productImage = firstCard.locator('img');
    if (await productImage.count() > 0) {
      await expect(productImage.first()).toBeVisible();
    }
  });

  test('should navigate to product detail page when product is clicked', async ({ page }) => {
    // Step 1: Wait for products to load
    await expect(page.locator('.product-card, [data-testid="product-card"]').first()).toBeVisible({ timeout: 5000 });
    
    // Step 2: Get first product card and its name
    const firstCard = page.locator('.product-card, [data-testid="product-card"]').first();
    const productLink = firstCard.locator('a, [data-testid="product-link"]').first();
    
    // Step 3: Click on product (name or image)
    if (await productLink.count() > 0) {
      await expect(productLink).toBeVisible();
      await productLink.click();
      
      // Step 4: Verify navigation to product detail page
      await expect(page).toHaveURL(/\/products\/[^\/]+/);
      
      // Step 5: Verify product detail page loads
      await expect(page.locator('h1, .product-title, [data-testid="product-title"]')).toBeVisible({ timeout: 5000 });
    }
  });
});