import { API_PATH_PREFIX, HMAC_ENABLED, HMAC_KEY_ID, HMAC_SECRET } from '../config'
import { randomId } from '../lib/random'
import { serverNowSec } from './clock'
import { computeSignature, HMAC_HEADERS } from './hmac'

const NONCE_LENGTH = 24

/** header ลายเซ็นของ request — ยังไม่ได้ตั้งคีย์คืน {} (backend โหมด log ยังรับ) */
export function signatureHeaders(method, path, body) {
  if (!HMAC_ENABLED) return {}
  const timestamp = serverNowSec()
  const nonce = randomId(NONCE_LENGTH)
  const signature = computeSignature(HMAC_SECRET, {
    method,
    pathWithQuery: `${API_PATH_PREFIX}${path}`,
    timestamp,
    nonce,
    body,
  })
  return {
    [HMAC_HEADERS.keyId]: HMAC_KEY_ID,
    [HMAC_HEADERS.timestamp]: String(timestamp),
    [HMAC_HEADERS.nonce]: nonce,
    [HMAC_HEADERS.signature]: signature,
  }
}
