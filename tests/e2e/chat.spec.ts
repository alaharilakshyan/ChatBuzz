import { test, expect } from '@playwright/test'

test.describe('Chat Stream Interactions', () => {
  test('should load navigation sidebars and handle messaging streams', async ({ page }) => {
    // Navigate directly to chat dashboard
    await page.goto('/chat/home')

    // 1. Verify structural sidebar elements exist
    const workspaceBar = page.locator('div:has-text("CB")').first()
    await expect(workspaceBar).toBeVisible()

    const sidebarHeader = page.locator('h3:has-text("Direct Messages")')
    await expect(sidebarHeader).toBeVisible()

    // 2. Locate personal profile avatar
    const profileAvatar = page.locator('span:has-text("T")').first() // Fallback avatar initial for "test"
    await expect(profileAvatar).toBeVisible()

    // 3. Locate direct message targets
    const friendLink = page.locator('a[href*="/chat/home/dm/"]').first()
    
    // If a friend is available in the seed database, run sending test
    if (await friendLink.isVisible()) {
      await friendLink.click()

      const testMessage = `Hello! E2E Test message at ${Date.now()}`

      // Type and submit inputs
      await page.fill('input[placeholder="Type a message..."]', testMessage)
      await page.click('button[type="submit"]')

      // Verify message bubble contains test text
      const lastMessageBubble = page.locator('p:has-text("Hello! E2E Test message at")').last()
      await expect(lastMessageBubble).toBeVisible({ timeout: 10000 })
      await expect(lastMessageBubble).toContainText(testMessage)
    }
  })
})
