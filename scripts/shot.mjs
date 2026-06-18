import { chromium } from 'playwright'

const BASE = 'http://localhost:3001'
const API = 'http://localhost:3009'
const OUT = '/tmp/chismo-shots'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })

// Ids reales para las páginas de detalle
async function firstId(path, key) {
  try {
    const r = await fetch(`${API}${path}`)
    const j = await r.json()
    const arr = Array.isArray(j) ? j : j.data
    return arr?.[0]?.[key] ?? null
  } catch { return null }
}
const chismeId = await firstId('/chismes?page=1&limit=1', 'id')
const cuestId = await firstId('/cuestionarios', 'id')
console.log('chismeId', chismeId, 'cuestId', cuestId)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1320, height: 940 }, deviceScaleFactor: 2 })

// Perfil en localStorage antes de cualquier script de la página
await ctx.addInitScript(() => {
  if (!localStorage.getItem('chismografo_profile')) {
    localStorage.setItem('chismografo_profile', JSON.stringify({ username: 'omar', avatarSeed: 'omar' }))
  }
})

const page = await ctx.newPage()

async function snap(name) {
  await page.waitForTimeout(900) // dejar asentar animaciones
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot', name)
}

async function setTheme(t) {
  await page.evaluate((v) => localStorage.setItem('chismografo_theme', v), t)
}

// Feed noche (dark es el default, sin tocar localStorage)
await page.goto(`${BASE}/feed`, { waitUntil: 'networkidle' })
await snap('01-feed-dark')

// Feed día
await setTheme('light')
await page.reload({ waitUntil: 'networkidle' })
await snap('02-feed-light')

// Setup (portada) — noche
await setTheme('dark')
await page.goto(`${BASE}/setup`, { waitUntil: 'networkidle' })
await snap('03-setup-dark')

// Trending día
await setTheme('light')
await page.goto(`${BASE}/trending`, { waitUntil: 'networkidle' })
await snap('04-trending-light')

// Detalle chisme noche
if (chismeId) {
  await setTheme('dark')
  await page.goto(`${BASE}/chisme/${chismeId}`, { waitUntil: 'networkidle' })
  await snap('05-chisme-dark')
}

// Cuestionario día
if (cuestId) {
  await setTheme('light')
  await page.goto(`${BASE}/cuestionario/${cuestId}`, { waitUntil: 'networkidle' })
  await snap('06-cuestionario-light')
}

await browser.close()
console.log('DONE')
