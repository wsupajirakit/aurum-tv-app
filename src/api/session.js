/**
 * session ของทีวี — ทำให้แอปทำงานต่อเนื่องไม่หลุด token
 *
 *   ครั้งแรก/ทุกทางพัง → POST /api/session (เซ็น HMAC) ได้ access + refresh token
 *   ใกล้หมดอายุ       → POST /api/session/refresh แลกคู่ใหม่ (rotation) ล่วงหน้าเอง
 *   refresh ถูกปฏิเสธ   → ขอ session ใหม่ทันทีด้วย HMAC (ไม่มีวันติดค้าง)
 *   เปิดแอปใหม่        → โหลด token จาก SecureStore ใช้ต่อได้เลย
 *
 * ห้าม import logger ที่นี่ — logger ส่งผ่าน client → session จะวนกันเอง
 */
import { AppState, Platform } from 'react-native'
import { SESSION_TIMING, STORAGE_KEYS } from '../config'
import { secure } from '../services/storage'
import { serverNowSec } from './clock'
import { getDeviceId } from './deviceId'
import { ApiError } from './errors'
import { send } from './transport'

const PATHS = { start: '/api/session', refresh: '/api/session/refresh' }

let tokens = null // { accessToken, accessExpiresAt (เวลาเซิร์ฟเวอร์), accessTtlSec, refreshToken }
let loaded = false
let inFlight = null
let blockedUntil = 0
let keeperTimer = null

async function load() {
  if (loaded) return
  loaded = true
  try {
    const raw = await secure.get(STORAGE_KEYS.session)
    tokens = raw ? JSON.parse(raw) : null
  } catch {
    tokens = null
  }
}

/** ต่ออายุล่วงหน้ากี่วินาที — ไม่เกิน 1/5 ของอายุ token (ตั้ง TTL สั้นๆ จะได้ไม่ refresh ทุก request) */
const MARGIN_FRACTION_OF_TTL = 5

function refreshMarginSec() {
  const ttl = tokens?.accessTtlSec || SESSION_TIMING.refreshMarginSec * MARGIN_FRACTION_OF_TTL
  return Math.min(SESSION_TIMING.refreshMarginSec, Math.floor(ttl / MARGIN_FRACTION_OF_TTL))
}

function accessIsFresh() {
  return Boolean(tokens?.accessToken) && tokens.accessExpiresAt - serverNowSec() > refreshMarginSec()
}

function scheduleKeeper() {
  clearTimeout(keeperTimer)
  if (!tokens?.accessExpiresAt) return
  const dueInMs = (tokens.accessExpiresAt - refreshMarginSec() - serverNowSec()) * 1000
  keeperTimer = setTimeout(() => {
    getAccessToken().catch(() => {})
  }, Math.max(SESSION_TIMING.minKeeperDelayMs, dueInMs))
}

function store(body) {
  tokens = {
    accessToken: body.accessToken,
    accessExpiresAt: (body.serverTime || serverNowSec()) + body.accessExpiresIn,
    accessTtlSec: body.accessExpiresIn,
    refreshToken: body.refreshToken,
  }
  secure.set(STORAGE_KEYS.session, JSON.stringify(tokens))
  scheduleKeeper()
}

async function startNew() {
  const deviceId = await getDeviceId()
  const res = await send(PATHS.start, { method: 'POST', json: { deviceId, platform: Platform.OS }, sign: true })
  if (!res.ok || !res.body?.accessToken) throw new ApiError('http_error', { status: res.status, body: res.body })
  store(res.body)
}

async function rotate() {
  const res = await send(PATHS.refresh, { method: 'POST', json: { refreshToken: tokens.refreshToken }, sign: true })
  if (res.ok && res.body?.accessToken) return store(res.body)
  // refresh token ใช้ไม่ได้แล้ว (หมดอายุ/ถูกเพิกถอน/เซิร์ฟเวอร์ล้างข้อมูล) → เริ่ม session ใหม่
  if (res.status === 401 || res.status === 400) return startNew()
  throw new ApiError('http_error', { status: res.status, body: res.body })
}

/**
 * access token ที่ยังใช้ได้ — ต่ออายุเองถ้าใกล้หมด (ทำทีละงานเดียว คนอื่นรอผลเดียวกัน)
 * ขอไม่สำเร็จ → throw และพักช่วงหนึ่งก่อนลองใหม่ (ผู้เรียกส่ง request ต่อแบบไม่มี token ได้)
 */
export async function getAccessToken({ forceRefresh = false } = {}) {
  await load()
  if (!forceRefresh && accessIsFresh()) return tokens.accessToken
  if (Date.now() < blockedUntil && !inFlight) throw new ApiError('network')

  if (!inFlight) {
    inFlight = (tokens?.refreshToken ? rotate() : startNew())
      .then(() => {
        blockedUntil = 0
      })
      .catch((err) => {
        blockedUntil = Date.now() + SESSION_TIMING.retryAfterFailMs
        throw err
      })
      .finally(() => {
        inFlight = null
      })
  }
  await inFlight
  return tokens?.accessToken || null
}

/** backend บอกว่า access token ใช้ไม่ได้ → รอบหน้าต่ออายุใหม่ทันที */
export function invalidateAccessToken() {
  if (tokens) tokens.accessExpiresAt = 0
  blockedUntil = 0
}

/** เรียกครั้งเดียวตอนเปิดแอป: เตรียม token ล่วงหน้า + เช็คใหม่ทุกครั้งที่กลับจากพักหน้าจอ */
export function startSessionKeeper() {
  getAccessToken().catch(() => {})
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') getAccessToken().catch(() => {})
  })
  return () => {
    sub.remove()
    clearTimeout(keeperTimer)
  }
}
