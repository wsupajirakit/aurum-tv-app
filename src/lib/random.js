/**
 * สตริงสุ่มแบบ base64url — ใช้ crypto.getRandomValues ถ้ามี (Hermes บางรุ่นไม่มี) ไม่งั้นใช้ Math.random
 * ใช้กับ nonce / deviceId ที่ต้องการแค่ "ไม่ซ้ำ" ไม่ได้เป็นความลับ (ลายเซ็น HMAC ครอบ nonce อยู่แล้ว)
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function randomBytes(length) {
  const bytes = new Uint8Array(length)
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}

export function randomId(length = 24) {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] & 63]
  return out
}
