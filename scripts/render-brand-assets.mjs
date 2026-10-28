/**
 * สร้างภาพแบรนด์ 4K (3840×2160) สำหรับทีวี 55 นิ้ว จาก SVG — รันซ้ำได้ภาพเดิมทุกครั้ง (สุ่มแบบมี seed)
 *
 *   npm run assets:brand
 *
 * ได้: assets/brand/aurum-tv-wallpaper-4k.jpg — ภาพเดียวใช้ทั้งหน้าเปิดแอป (splash) และหน้าหลัก (ภาพนิ่ง)
 *      assets/brand/aurum-tv-logo-mark.png    — โลโก้กลางจอของ native splash (Android 12+ แสดงได้แค่ไอคอน)
 * ภาพเดิมก่อนรีแบรนด์เก็บไว้ใน branch legacy/brand-assets
 * ข้อความ tagline ไม่ฝังในภาพ — แอปวาดเองตามภาษา (i18n: splash.tagline)
 * โทนสีอิงแบรนด์เดิม (ดำคาร์บอน + ทอง) · เนื้อหาหลักอยู่ใน safe area 90% กันทีวี overscan
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(appRoot, 'assets', 'brand')
/** ชื่อระบบที่วาดลงภาพ — เปลี่ยนชื่อแบรนด์แก้ที่นี่แล้วรัน npm run assets:brand */
const BRAND_NAME = 'AURUM TV'
const WALLPAPER = 'aurum-tv-wallpaper-4k'
const LOGO_MARK = 'aurum-tv-logo-mark.png'
/** ตัวอักษรชื่อแบรนด์ (ประกายดาววางตามความกว้างโดยประมาณของชื่อ ไม่ใช้พิกัดตายตัว) */
const TITLE = { y: 1625, size: 300, spacing: 22, glyphWidth: 0.74 }
const titleHalfWidth = () => (BRAND_NAME.length * TITLE.size * TITLE.glyphWidth + (BRAND_NAME.length - 1) * TITLE.spacing) / 2

const W = 3840
const H = 2160
const CX = W / 2
const JPEG_QUALITY = '88'
const SEED = 20261027

/** PRNG แบบมี seed (mulberry32) — ภาพเดิมทุกครั้งที่รัน */
function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GOLD_STOPS = `
  <stop offset="0" stop-color="#7a5418"/>
  <stop offset="0.22" stop-color="#f7e3a3"/>
  <stop offset="0.42" stop-color="#c8922c"/>
  <stop offset="0.62" stop-color="#fff2c2"/>
  <stop offset="0.82" stop-color="#b07d24"/>
  <stop offset="1" stop-color="#5e3f10"/>`

// ---------- ส่วนประกอบ ----------

const TV = { x: 1060, y: 250, w: 1720, h: 968, r: 22 }
const PLAY = { cx: CX, cy: TV.y + TV.h / 2, size: 500 }

function particles(rand) {
  const out = []
  // ประกายทองเล็กๆ กระจายรอบสัญลักษณ์ play (หนาแน่นใกล้ศูนย์กลาง)
  for (let i = 0; i < 340; i += 1) {
    const angle = rand() * Math.PI * 2
    const dist = 120 + Math.pow(rand(), 1.6) * 640
    const x = PLAY.cx + Math.cos(angle) * dist * 1.35
    const y = PLAY.cy + Math.sin(angle) * dist * 0.72
    if (x < TV.x + 40 || x > TV.x + TV.w - 40 || y < TV.y + 40 || y > TV.y + TV.h - 40) continue
    const r = 1.5 + rand() * 6
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffd877" opacity="${(0.35 + rand() * 0.6).toFixed(2)}"/>`)
  }
  // bokeh วงใหญ่เบลอ
  for (let i = 0; i < 26; i += 1) {
    const x = TV.x + 120 + rand() * (TV.w - 240)
    const y = TV.y + 100 + rand() * (TV.h - 200)
    const r = 18 + rand() * 46
    out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#f5c76a" opacity="${(0.06 + rand() * 0.12).toFixed(2)}" filter="url(#blurBokeh)"/>`)
  }
  return out.join('\n')
}

function hexagon(cx, cy, r) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  })
  return `<polygon points="${pts.join(' ')}"/>`
}

function hexField(side) {
  const r = 120
  const out = []
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x0 = side === 'left' ? 240 + col * r * 1.732 + (row % 2) * r * 0.866 : W - 240 - col * r * 1.732 - (row % 2) * r * 0.866
      const y0 = 420 + row * r * 1.5
      const fade = 1 - col / 4
      out.push(`<g opacity="${(0.05 + 0.14 * fade).toFixed(2)}">${hexagon(x0, y0, r)}</g>`)
    }
  }
  return out.join('\n')
}

function playSymbol() {
  const s = PLAY.size
  const left = PLAY.cx - s * 0.42
  const right = PLAY.cx + s * 0.58
  const top = PLAY.cy - s * 0.58
  const bottom = PLAY.cy + s * 0.58
  const outer = `M ${left} ${top} L ${right} ${PLAY.cy} L ${left} ${bottom} Z`
  const inset = 64
  const inner = `M ${left + inset} ${top + inset * 1.55} L ${right - inset * 1.75} ${PLAY.cy} L ${left + inset} ${bottom - inset * 1.55} Z`
  const facetTop = `M ${left + inset} ${top + inset * 1.55} L ${right - inset * 1.75} ${PLAY.cy} L ${PLAY.cx - s * 0.05} ${PLAY.cy} Z`
  return `
  <g filter="url(#glowStrong)" opacity="0.85"><path d="${outer}" fill="#ffcf5c"/></g>
  <path d="${outer}" fill="url(#goldDiag)" stroke="#fff3c9" stroke-width="10" stroke-linejoin="round"/>
  <path d="${inner}" fill="url(#goldFacet)" stroke="#8a5f17" stroke-width="6" stroke-linejoin="round"/>
  <path d="${facetTop}" fill="#fff6d6" opacity="0.35"/>`
}

function sparkle(x, y, size) {
  const s = size
  return `<g filter="url(#glowSoft)">
    <path d="M ${x} ${y - s} L ${x + s * 0.12} ${y - s * 0.12} L ${x + s} ${y} L ${x + s * 0.12} ${y + s * 0.12} L ${x} ${y + s} L ${x - s * 0.12} ${y + s * 0.12} L ${x - s} ${y} L ${x - s * 0.12} ${y - s * 0.12} Z" fill="#fffbe8"/>
  </g>`
}

/** gradient/filter ใช้ร่วมทั้งภาพเต็มและโลโก้ */
function defs() {
  return `  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="75%">
      <stop offset="0" stop-color="#1e180c"/>
      <stop offset="0.45" stop-color="#0b0906"/>
      <stop offset="1" stop-color="#030303"/>
    </radialGradient>
    <pattern id="carbon" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="28" height="28" fill="none"/>
      <line x1="0" y1="0" x2="0" y2="28" stroke="#ffffff" stroke-width="10" opacity="0.022"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.75"/>
    </radialGradient>
    <linearGradient id="goldFrame" x1="0" y1="0" x2="1" y2="1">${GOLD_STOPS}</linearGradient>
    <linearGradient id="goldDiag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff0b8"/>
      <stop offset="0.45" stop-color="#e3a93a"/>
      <stop offset="1" stop-color="#7a5013"/>
    </linearGradient>
    <linearGradient id="goldFacet" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#9c6a1b"/>
      <stop offset="0.5" stop-color="#ffd978"/>
      <stop offset="1" stop-color="#fff7da"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff6d0"/>
      <stop offset="0.38" stop-color="#f3c95e"/>
      <stop offset="0.62" stop-color="#a8721c"/>
      <stop offset="1" stop-color="#f6d27a"/>
    </linearGradient>
    <radialGradient id="screen" cx="50%" cy="48%" r="70%">
      <stop offset="0" stop-color="#211a0e"/>
      <stop offset="0.5" stop-color="#0c0a08"/>
      <stop offset="1" stop-color="#040404"/>
    </radialGradient>
    <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffcc5a" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffcc5a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffe7a8" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffe7a8" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d9a441" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffe3a0" stop-opacity="1"/>
      <stop offset="1" stop-color="#d9a441" stop-opacity="0"/>
    </linearGradient>
    <filter id="glowStrong" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glowFrame" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="38"/></filter>
    <filter id="glowSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="glowText" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="blurBokeh" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>`
}

function buildSvg() {
  const rand = rng(SEED)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${defs()}

  <!-- พื้นหลังคาร์บอน + แสงอุ่นกลางจอ -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#carbon)"/>
  <g fill="none" stroke="#d6a445" stroke-width="3">
    ${hexField('left')}
    ${hexField('right')}
  </g>
  <rect x="-400" y="${H * 0.18}" width="${W + 800}" height="420" fill="url(#beam)" transform="rotate(-14 ${CX} ${H / 2})"/>

  <!-- กรอบทีวีทอง -->
  <rect x="${TV.x}" y="${TV.y}" width="${TV.w}" height="${TV.h}" rx="${TV.r}" fill="none" stroke="#e8b54a" stroke-width="40" opacity="0.55" filter="url(#glowFrame)"/>
  <rect x="${TV.x}" y="${TV.y}" width="${TV.w}" height="${TV.h}" rx="${TV.r}" fill="url(#screen)"/>
  <ellipse cx="${PLAY.cx}" cy="${PLAY.cy}" rx="620" ry="360" fill="url(#screenGlow)"/>
  ${particles(rand)}
  ${playSymbol()}
  <rect x="${TV.x}" y="${TV.y}" width="${TV.w}" height="${TV.h}" rx="${TV.r}" fill="none" stroke="url(#goldFrame)" stroke-width="26"/>
  <rect x="${TV.x + 22}" y="${TV.y + 22}" width="${TV.w - 44}" height="${TV.h - 44}" rx="${TV.r - 8}" fill="none" stroke="#3a2a10" stroke-width="6"/>

  <!-- ชื่อแบรนด์ -->
  <text x="${CX}" y="${TITLE.y}" text-anchor="middle" font-family="Didot, 'Bodoni 72', 'Times New Roman', serif" font-weight="700" font-size="${TITLE.size}" letter-spacing="${TITLE.spacing}" fill="#f2b84b" opacity="0.55" filter="url(#glowText)">${BRAND_NAME}</text>
  <text x="${CX}" y="${TITLE.y}" text-anchor="middle" font-family="Didot, 'Bodoni 72', 'Times New Roman', serif" font-weight="700" font-size="${TITLE.size}" letter-spacing="${TITLE.spacing}" fill="url(#goldText)" stroke="#3b2608" stroke-width="3">${BRAND_NAME}</text>
  ${sparkle(CX + titleHalfWidth() - 20, TITLE.y - TITLE.size * 0.8, 70)}
  <rect x="${CX - 620}" y="1712" width="1240" height="4" fill="url(#rule)"/>

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`
}

/** โลโก้สำหรับ native splash (Android 12+ แสดงได้แค่ไอคอนกลางจอ) — พื้นโปร่งใส ครอปรอบสัญลักษณ์ play */
function buildMarkSvg() {
  const half = PLAY.size * 1.1
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="${PLAY.cx - half} ${PLAY.cy - half} ${half * 2} ${half * 2}">
${defs()}
  <ellipse cx="${PLAY.cx}" cy="${PLAY.cy}" rx="${half * 0.9}" ry="${half * 0.9}" fill="url(#screenGlow)"/>
  ${playSymbol()}
</svg>`
}

function render(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Times New Roman' },
  })
    .render()
    .asPng()
}

fs.mkdirSync(outDir, { recursive: true })

const svg = buildSvg()
const pngPath = path.join(outDir, `${WALLPAPER}.png`)
fs.writeFileSync(pngPath, render(svg, W))

// PNG 4K ใหญ่เกินสำหรับ bundle → แปลงเป็น JPEG (macOS: sips) · ไม่มี sips ใช้ PNG ต่อ
const jpgPath = path.join(outDir, `${WALLPAPER}.jpg`)
try {
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', JPEG_QUALITY, pngPath, '--out', jpgPath], { stdio: 'ignore' })
  fs.rmSync(pngPath)
  console.log(`✓ ${path.relative(appRoot, jpgPath)} (${(fs.statSync(jpgPath).size / 1024).toFixed(0)} KB)`)
} catch {
  console.warn('! ไม่มี sips — ใช้ PNG แทน (แก้ src/config/splash.js ให้ชี้ไฟล์ .png)')
}

fs.writeFileSync(path.join(outDir, LOGO_MARK), render(buildMarkSvg(), 1024))
console.log(`✓ ${path.relative(appRoot, path.join(outDir, LOGO_MARK))}`)
