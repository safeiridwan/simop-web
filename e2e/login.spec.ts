import { expect, test } from '@playwright/test'

test.describe('login', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'SIMOP' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
  })

  test('shows an error on invalid credentials', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'invalid email or password' } }),
      }),
    )

    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('wrong')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page.getByText('invalid email or password')).toBeVisible()
  })

  test('redirects a protected route to login', async ({ page }) => {
    // No valid refresh cookie -> bootstrap fails; guard sends us to /login.
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":{"code":"UNAUTHENTICATED"}}' }),
    )
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
