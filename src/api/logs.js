import { TIMING } from '../config'
import { apiRequest } from './client'

/** ส่ง log ก้อนหนึ่งขึ้น backend */
export function postLogs(batch) {
  return apiRequest('/api/logs', {
    method: 'POST',
    json: batch.length === 1 ? batch[0] : { logs: batch },
    timeoutMs: TIMING.logRequestTimeoutMs,
  })
}
