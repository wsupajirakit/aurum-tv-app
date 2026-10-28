/**
 * ตรวจว่าลายเซ็น HMAC ฝั่งแอปตรงกับ backend — ใช้ test vector เดียวกับ backend internal/auth/hmacsig/hmacsig_test.go
 * รัน: node scripts/verify-signer.mjs   (exit 1 ถ้าไม่ตรง)
 */
import { computeSignature } from '../src/api/hmac.js'
import { bytesToBase64Url } from '../src/lib/base64url.js'

const VECTOR = {
  secret: 'vector-secret',
  method: 'POST',
  pathWithQuery: '/api/channels/abc/sync?x=1',
  timestamp: 1700000000,
  nonce: 'abcdefghijklmnop',
  body: '{"url":"https://x.byteark.com/a.m3u8"}',
  expected: 'I6hID3u0f3PSSR8lo7Xxihrki3VC4ye0l7Bwt1FcBJE',
}

const actual = computeSignature(VECTOR.secret, VECTOR)
const ok = actual === VECTOR.expected

// base64url ต้องตรงกับ Buffer ทุกความยาว (ทั้งกรณีเหลือเศษ 0/1/2 ไบต์)
let b64ok = true
for (let len = 0; len < 40; len += 1) {
  const bytes = Uint8Array.from({ length: len }, (_, i) => (i * 37 + len) & 255)
  if (bytesToBase64Url(bytes) !== Buffer.from(bytes).toString('base64url')) b64ok = false
}

console.log(`signature ${ok ? 'OK' : 'MISMATCH'}  ${actual}`)
console.log(`base64url ${b64ok ? 'OK' : 'MISMATCH'}`)
process.exit(ok && b64ok ? 0 : 1)
