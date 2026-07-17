import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate user', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'password123'

  // 1. Seed deterministic test user via backend API
  const apiURL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:4000/api/v1'
  try {
    const response = await page.request.post(`${apiURL}/auth/register`, {
      data: {
        email,
        password,
        username: 'testuser'
      }
    })
    if (response.ok()) {
      console.log('✅ Deterministic test user seeded successfully.')
    } else {
      const errorText = await response.text()
      console.log(`ℹ️ Seed response: ${response.status()} - ${errorText}`)
    }
  } catch (err) {
    console.log('⚠️ Failed to reach backend API for seeding test user:', err)
  }

  // 2. Navigate to login
  await page.goto('/login')

  // If already logged in (redirected to /chat), skip form submission
  if (page.url().includes('/chat')) {
    console.log('⚡ Already logged in, bypassing form submission.')
  } else {
    // Fill credentials
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)

    // Click Submit
    await page.click('button[type="submit"]')
  }

  // 3. Wait for redirect to /chat path
  await page.waitForURL(url => url.pathname.startsWith('/chat'), { timeout: 15000 })

  // Verify auth cookie is set
  const cookies = await page.context().cookies()
  const hasToken = cookies.some(c => c.name === 'chatbuzz_token')
  console.log(`🔑 Auth cookie verified: ${hasToken}`)

  // Save auth state
  await page.context().storageState({ path: authFile })
})
