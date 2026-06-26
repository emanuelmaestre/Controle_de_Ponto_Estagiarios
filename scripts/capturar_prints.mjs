import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'https://controle-de-ponto-estagiarios.vercel.app'
const OUT_DIR  = './screenshots'

const ADMIN   = { email: 'milton.lima@ifgoiano.edu.br', pass: 'Milton157@' }
const INTERN  = { email: 'emanuelmaestree@gmail.com',   pass: '123456' }

fs.mkdirSync(OUT_DIR, { recursive: true })

async function login(page, { email, pass }) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('input[type="email"], input[placeholder*="mail"]', { timeout: 10000 })
  await page.fill('input[type="email"], input[placeholder*="mail"]', email)
  await page.fill('input[type="password"]', pass)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2000)
}

async function shot(page, name, { scrollTo = 0, wait = 0 } = {}) {
  if (wait) await page.waitForTimeout(wait)
  if (scrollTo) await page.evaluate(y => window.scrollTo(0, y), scrollTo)
  await page.waitForTimeout(500)
  const p = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: p, fullPage: false })
  console.log(`  ✓ ${name}`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const viewport = { width: 1440, height: 900 }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  console.log('\n=== ADMIN ===')
  const actx = await browser.newContext({ viewport })
  const ap   = await actx.newPage()

  await ap.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(1500)
  await shot(ap, '01_login')

  await login(ap, ADMIN)

  // Dashboard admin
  await ap.waitForSelector('h1, [class*="dashboard"], nav', { timeout: 10000 })
  await ap.waitForTimeout(2000)
  await shot(ap, '02_admin_dashboard')
  await shot(ap, '02_admin_dashboard_bottom', { scrollTo: 500 })

  // Aprovações
  await ap.goto(`${BASE_URL}/admin/approvals`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '03_admin_approvals')

  // Estagiários
  await ap.goto(`${BASE_URL}/admin/interns`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '04_admin_interns')

  // Relatórios
  await ap.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '05_admin_reports')

  // Ranking
  await ap.goto(`${BASE_URL}/admin/ranking`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '06_admin_ranking')

  // Carga horária
  await ap.goto(`${BASE_URL}/admin/workload`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '07_admin_workload')

  // Atualizações
  await ap.goto(`${BASE_URL}/admin/updates`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '08_admin_updates')

  // Configurações
  await ap.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' })
  await ap.waitForTimeout(2000)
  await shot(ap, '09_admin_settings')

  await actx.close()

  // ── ESTAGIÁRIO ────────────────────────────────────────────────────────────
  console.log('\n=== ESTAGIÁRIO ===')
  const ictx = await browser.newContext({ viewport })
  const ip   = await ictx.newPage()

  await login(ip, INTERN)

  // Dashboard
  await ip.waitForSelector('button, [class*="clock"], [class*="dashboard"]', { timeout: 10000 })
  await ip.waitForTimeout(2000)
  await shot(ip, '10_intern_dashboard')

  // Histórico
  await ip.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle' })
  await ip.waitForTimeout(2000)
  await shot(ip, '11_intern_history')

  // Ranking
  await ip.goto(`${BASE_URL}/intern-ranking`, { waitUntil: 'networkidle' })
  await ip.waitForTimeout(2000)
  await shot(ip, '12_intern_ranking')

  // Perfil
  await ip.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' })
  await ip.waitForTimeout(2000)
  await shot(ip, '13_intern_profile')

  // Perfil — conquistas (scroll)
  await shot(ip, '14_intern_profile_achievements', { scrollTo: 600 })

  // Perfil — novidades (clicar na aba)
  try {
    const tabs = await ip.$$('[class*="tab"], button')
    for (const t of tabs) {
      const txt = await t.textContent()
      if (txt && txt.toLowerCase().includes('novid')) {
        await t.click()
        await ip.waitForTimeout(1000)
        break
      }
    }
  } catch {}
  await shot(ip, '15_intern_updates')

  await ictx.close()

  // ── MOBILE (estagiário) ───────────────────────────────────────────────────
  console.log('\n=== MOBILE ===')
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mp   = await mctx.newPage()

  await login(mp, INTERN)
  await mp.waitForTimeout(2000)
  await shot(mp, '16_mobile_dashboard')

  await mp.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' })
  await mp.waitForTimeout(2000)
  await shot(mp, '17_mobile_profile')

  await mctx.close()
  await browser.close()

  console.log(`\n✅ ${fs.readdirSync(OUT_DIR).length} screenshots em ./${OUT_DIR}/`)
})()
