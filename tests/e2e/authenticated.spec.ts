import { expect, test, type Page } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const studentEmail = process.env.E2E_STUDENT_EMAIL
const studentPassword = process.env.E2E_STUDENT_PASSWORD

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/v2/login', { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

async function expectPageHealthy(page: Page, path: string) {
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
  await expect(page.locator('body')).not.toContainText('404 This page could not be found')
  expect(errors, `Client errors on ${path}`).toEqual([])
}

test.describe('authenticated admin flow', () => {
  test.skip(!adminEmail || !adminPassword, 'Admin E2E credentials are not configured.')

  test('admin signs in and opens read-only admin pages', async ({ page }) => {
    await signIn(page, adminEmail!, adminPassword!)
    await expect(page).toHaveURL(/\/v2$/)
    await expect(page.locator('body')).toContainText(/Admin|Painel/)

    await expectPageHealthy(page, '/v2/interns')
    await expect(page.locator('body')).toContainText('Estagiarios')

    await expectPageHealthy(page, '/v2/reports')
    await expect(page.locator('body')).toContainText('Relatorios')

    await expectPageHealthy(page, '/v2/settings')
    await expect(page.locator('body')).toContainText('Configuracoes')
  })
})

test.describe('authenticated student flow', () => {
  test.skip(!studentEmail || !studentPassword, 'Student E2E credentials are not configured.')

  test('student signs in and opens read-only student pages', async ({ page }) => {
    await signIn(page, studentEmail!, studentPassword!)
    await expect(page).toHaveURL(/\/v2\/dashboard$/)
    await expect(page.locator('body')).toContainText(/Registrar Entrada|Registrar Saida/)

    await expectPageHealthy(page, '/v2/history')
    await expect(page.locator('body')).toContainText('Historico')

    await expectPageHealthy(page, '/v2/profile')
    await expect(page.locator('body')).toContainText('Perfil')

    await expectPageHealthy(page, '/v2/ranking')
    await expect(page.locator('body')).toContainText('Ranking')
  })
})
