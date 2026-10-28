import { CH3 } from '../../config'

const EXPIRES_RE = new RegExp(`${CH3.expiresParam}=(\\d+)`)
const nowSec = () => Math.floor(Date.now() / 1000)

/** เวลาหมดอายุ (unix seconds) จาก signed URL — ไม่มีคืน null */
export function readExpiresAt(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(EXPIRES_RE)
  return match ? parseInt(match[1], 10) : null
}

/**
 * URL กำลังจะหมดอายุ (หรือหมดแล้ว) ภายใน thresholdSec หรือไม่
 * ไม่มี URL = ถือว่าหมดอายุ · URL ไม่มีวันหมดอายุในตัว = ไม่หมดอายุ
 */
export function isUrlExpiring(url, thresholdSec = CH3.cacheMinRemainingSec) {
  if (!url || typeof url !== 'string') return true
  const expiresAt = readExpiresAt(url)
  if (expiresAt === null) return false
  return expiresAt <= nowSec() + thresholdSec
}

/** เวลาหมดอายุของ URL หรือค่าประมาณถ้า URL ไม่ระบุ */
export function expiresAtOrAssumed(url) {
  return readExpiresAt(url) ?? nowSec() + CH3.assumedLifetimeSec
}

export { nowSec }
