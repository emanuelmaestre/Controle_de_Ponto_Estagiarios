import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'fs'

const BASE = 'https://controle-de-ponto-estagiarios.vercel.app'
const OUT  = 'C:/Users/Windows/Controle de Ponto Estágiarios/screenshots'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const ADMIN  = { email: 'milton.lima@ifgoiano.edu.br', pass: process.env.ADMIN_PASS  || '' }
const INTERN = { email: 'emanuelmaestree@gmail.com',   pass: process.env.INTERN_PASS || '' }

mkdirSync(OUT, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function shot(page, nome) {
  await sleep(1500)
  await page.screenshot({ path: `${OUT}/${nome}.png`, clip: { x:0, y:0, width:1440, height:900 } })
  console.log(`✓ ${nome}`)
}

async function login(page, { email, pass }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.type('input[type="email"]', email, { delay: 30 })
  await page.type('input[type="password"]', pass, { delay: 30 })
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
  await sleep(2000)
}

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  // ── LOGIN ─────────────────────────────────────
  const p1 = await browser.newPage()
  await p1.goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
  await shot(p1, '01_login')

  // ── ADMIN ─────────────────────────────────────
  console.log('\n=== ADMIN ===')
  await login(p1, ADMIN)
  await shot(p1, '02_admin_dashboard')

  const adminPages = [
    ['03_admin_approvals', '/admin/approvals'],
    ['04_admin_interns',   '/admin/interns'],
    ['05_admin_reports',   '/admin/reports'],
    ['06_admin_ranking',   '/admin/ranking'],
    ['07_admin_workload',  '/admin/workload'],
    ['08_admin_updates',   '/admin/updates'],
    ['09_admin_feedback',  '/admin/feedback'],
    ['10_admin_settings',  '/admin/settings'],
  ]
  for (const [nome, rota] of adminPages) {
    await p1.goto(`${BASE}${rota}`, { waitUntil: 'networkidle2' })
    await shot(p1, nome)
  }
  await p1.close()

  // ── ESTAGIÁRIO ────────────────────────────────
  console.log('\n=== ESTAGIÁRIO ===')
  const p2 = await browser.newPage()
  await login(p2, INTERN)
  await shot(p2, '11_intern_dashboard')

  const internPages = [
    ['12_intern_history',  '/history'],
    ['13_intern_ranking',  '/intern-ranking'],
    ['14_intern_profile',  '/profile'],
  ]
  for (const [nome, rota] of internPages) {
    await p2.goto(`${BASE}${rota}`, { waitUntil: 'networkidle2' })
    await shot(p2, nome)
  }

  // conquistas (scroll)
  await p2.evaluate(() => window.scrollTo(0, 600))
  await sleep(600)
  await p2.screenshot({ path: `${OUT}/15_intern_achievements.png`, clip: { x:0, y:0, width:1440, height:900 } })
  console.log('✓ 15_intern_achievements')
  await p2.close()

  // ── MOBILE ────────────────────────────────────
  console.log('\n=== MOBILE ===')
  const p3 = await browser.newPage()
  await p3.setViewport({ width: 390, height: 844 })
  await login(p3, INTERN)
  await shot(p3, '16_mobile_dashboard')
  await p3.goto(`${BASE}/profile`, { waitUntil: 'networkidle2' })
  await shot(p3, '17_mobile_profile')
  await p3.close()

  await browser.close()
  console.log(`\n✅ Prints salvos em: ${OUT}`)
})()
