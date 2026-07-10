import { test, expect } from '@playwright/test'

// Reset state to test unauthenticated login actions
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Authentication Flow', () => {
  test('should display login page elements', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Welcome back!')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('should display error message on invalid login credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Verify error toast or feedback container is displayed
    const toast = page.locator('ol li') // shadcn toast target
    await expect(toast).toBeVisible({ timeout: 10000 })
    await expect(toast).toContainText('Authentication Failed')
  })
})
