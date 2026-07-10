import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate user', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'password123'

  // Navigate to login
  await page.goto('/login')

  // Fill credentials
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)

  // Click Submit
  await page.click('button[type="submit"]')

  // Wait for redirect to /chat/home (or chat workspace landing page)
  await page.waitForURL('**/chat/home', { timeout: 15000 })

  // Assert URL state is correct
  await expect(page).toHaveURL(/.*chat\/home/)

  // Save auth state
  await page.context().storageState({ path: authFile })
})
