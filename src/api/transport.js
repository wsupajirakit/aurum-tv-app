/**
 * ส่ง request ไป backend หนึ่งครั้ง (+ลองซ้ำอัตโนมัติเฉพาะกรณีลายเซ็นตกเพราะนาฬิกา/nonce)
 * ไม่รู้เรื่อง session — session.js และ client.js ประกอบต่อจากนี้
 */
import { API_URL, TIMING } from '../config'
import { SERVER_TIME_HEADER, syncServerTime } from './clock'
import { ApiError } from './errors'
import { signatureHeaders } from './signer'

/** 401 ที่แก้ได้ด้วยการเซ็นใหม่ทันที (นาฬิกาถูกปรับจาก response แล้ว / nonce ชนกัน) */
const RESIGN_CODES = new Set(['clock_skew', 'replayed'])

async function sendOnce(path, { method, body, sign, token, timeoutMs }) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (sign) Object.assign(headers, signatureHeaders(method, path, body || ''))
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_URL}${path}`, { method, headers, body, signal: controller.signal })
    syncServerTime(response.headers.get(SERVER_TIME_HEADER))
    const data = await response.json().catch(() => null)
    return { ok: response.ok, status: response.status, body: data }
  } catch (err) {
    if (err?.name === 'AbortError') throw new ApiError('timeout', { cause: err })
    throw new ApiError('network', { cause: err })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * @param {string} path เช่น '/api/channels?enabled=true'
 * @param {{ method?: string, json?: unknown, sign?: boolean, token?: string|null, timeoutMs?: number }} [options]
 * @returns {Promise<{ ok: boolean, status: number, body: any }>}
 */
export async function send(path, { method = 'GET', json, sign = false, token = null, timeoutMs = TIMING.requestTimeoutMs } = {}) {
  const body = json === undefined ? undefined : JSON.stringify(json)
  const options = { method, body, sign, token, timeoutMs }
  const res = await sendOnce(path, options)
  if (sign && res.status === 401 && RESIGN_CODES.has(res.body?.code)) {
    if (res.body?.serverTime) syncServerTime(res.body.serverTime)
    return sendOnce(path, options)
  }
  return res
}
