/**
 * คิวส่ง log ขึ้น backend แบบ non-blocking — รวมเป็นก้อน, error ส่งทันที, เน็ตหลุดเก็บไว้ส่งใหม่
 */
import { Platform } from 'react-native'
import { LOG_QUEUE } from '../../config'
import { postLogs } from '../../api/logs'

const DEVICE_INFO = {
  platform: Platform.OS,
  version: Platform.Version,
  isTV: Platform.isTV,
}

let queue = []
let isFlushing = false
let flushTimer = null

const isUrgent = (item) => item.level === 'error' || item.state.includes('ERROR')

async function flush() {
  if (isFlushing || queue.length === 0) return
  isFlushing = true
  const batch = queue.slice(0, LOG_QUEUE.batchSize)
  queue = queue.slice(LOG_QUEUE.batchSize)

  try {
    await postLogs(batch)
  } catch {
    // ส่งไม่ผ่าน → ใส่คืนหัวคิว (จำกัดขนาด กันแรมบวม)
    if (queue.length < LOG_QUEUE.maxQueued) queue = [...batch, ...queue]
  } finally {
    isFlushing = false
    if (queue.length > 0) setTimeout(flush, LOG_QUEUE.retryDelayMs)
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, LOG_QUEUE.batchDelayMs)
}

/** ใส่ log เข้าคิว — ไม่บล็อก UI ไม่ throw */
export function sendAppLog({
  level = 'info',
  tag = 'App',
  state = 'UNKNOWN',
  message = '',
  details = {},
  channelId = null,
  channelName = null,
} = {}) {
  const item = {
    level,
    tag,
    state,
    message,
    details: { ...details, device: DEVICE_INFO },
    channelId,
    channelName,
    clientTime: new Date().toISOString(),
  }
  queue.push(item)
  if (isUrgent(item)) flush()
  else scheduleFlush()
}
