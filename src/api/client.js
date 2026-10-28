import { ApiError } from './errors'
import { getAccessToken, invalidateAccessToken } from './session'
import { send } from './transport'

/** 401 ที่แก้ได้ด้วยการต่ออายุ access token แล้วยิงใหม่ */
const TOKEN_RETRY_CODES = new Set(['access_token_invalid', 'access_token_missing', 'session_revoked'])

/**
 * เรียก backend — คืน JSON body หรือ throw ApiError
 * @param {string} path
 * @param {{ method?: string, json?: unknown, auth?: 'none'|'session', timeoutMs?: number }} [options]
 *   auth='session' = เซ็น HMAC + แนบ access token (ไม่มี token ก็ยังส่ง เผื่อ backend โหมด log/เวอร์ชันเก่า)
 */
export async function apiRequest(path, { method = 'GET', json, auth = 'session', timeoutMs } = {}) {
  const signed = auth === 'session'
  const attempt = async () => {
    const token = signed ? await getAccessToken().catch(() => null) : null
    return send(path, { method, json, sign: signed, token, timeoutMs })
  }

  let res = await attempt()
  if (signed && res.status === 401 && TOKEN_RETRY_CODES.has(res.body?.code)) {
    invalidateAccessToken()
    res = await attempt()
  }
  if (!res.ok) throw new ApiError('http_error', { status: res.status, body: res.body })
  return res.body
}
