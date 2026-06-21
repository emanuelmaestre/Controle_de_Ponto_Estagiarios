import { expect, test, type Page } from '@playwright/test'

async function expectNoClientErrors(page: Page, path: string) {
  const errors: string[] = []

  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', error => {
    errors.push(error.message)
  })

  await page.goto(path, { waitUntil: 'networkidle' })
  await expect(page).toHaveTitle(/ChronosLab/)
  expect(errors, `Client errors on ${path}`).toEqual([])
}

test.describe('public access', () => {
  test('v2 login renders the current sign-in flow', async ({ page }) => {
    await expectNoClientErrors(page, '/v2/login')

    await expect(page.getByRole('heading', { name: 'ChronosLab' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/v2/register')
  })

  test('v2 register renders without submitting data', async ({ page }) => {
    await expectNoClientErrors(page, '/v2/register')

    await expect(page.getByRole('heading', { name: 'Criar Conta' })).toBeVisible()
    await expect(page.getByLabel('Nome completo')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Curso (opcional)')).toBeVisible()
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirmar senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeVisible()
  })

  test('offline page renders retry state', async ({ page }) => {
    await expectNoClientErrors(page, '/offline')

    await expect(page.getByRole('heading', { name: 'SEM CONEXÃO' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'TENTAR NOVAMENTE' })).toBeVisible()
  })
})

test.describe('authentication boundaries', () => {
  const protectedPaths = [
    '/dashboard',
    '/v2/dashboard',
    '/history',
    '/profile',
    '/admin',
    '/admin/reports',
    '/admin/interns',
    '/checkout',
    '/v2/checkout',
    '/ranking/rules',
    '/admin/ranking/rules',
    '/api/health',
  ]

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated users to login`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })

      await expect(page).toHaveURL(new RegExp(`/login\\?redirect=${encodeURIComponent(path)}`))
      await expect(page).toHaveTitle(/ChronosLab/)
    })
  }
})
