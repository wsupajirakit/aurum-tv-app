/**
 * แกนลายเซ็น HMAC — ต้องประกอบสตริงเหมือน backend (backend internal/auth/hmacsig/canonical.go) ทุกตัวอักษร
 *
 *   v1\n{METHOD}\n{pathname+search}\n{timestamp}\n{nonce}\n{sha256hex(body)}
 *
 * import แบบมีนามสกุล .js เพื่อให้ scripts/verify-signer.mjs รันด้วย node ตรวจ test vector ได้
 */
import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import { bytesToBase64Url } from '../lib/base64url.js'

export const SIGNATURE_VERSION = 'v1'

export const HMAC_HEADERS = {
  keyId: 'X-TV-Key-Id',
  timestamp: 'X-TV-Timestamp',
  nonce: 'X-TV-Nonce',
  signature: 'X-TV-Signature',
}

export function canonicalString({ method, pathWithQuery, timestamp, nonce, body }) {
  const bodyHash = bytesToHex(sha256(utf8ToBytes(body || '')))
  return [SIGNATURE_VERSION, method.toUpperCase(), pathWithQuery, String(timestamp), nonce, bodyHash].join('\n')
}

export function computeSignature(secret, parts) {
  return bytesToBase64Url(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(canonicalString(parts))))
}
