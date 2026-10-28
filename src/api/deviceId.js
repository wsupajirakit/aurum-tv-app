import { STORAGE_KEYS } from '../config'
import { randomId } from '../lib/random'
import { secure } from '../services/storage'

const DEVICE_ID_PREFIX = 'tv-'
let cached = null

/** id ประจำเครื่อง สุ่มครั้งแรกแล้วเก็บไว้ — backend ใช้ผูก session (1 เครื่อง 1 session) */
export async function getDeviceId() {
  if (cached) return cached
  const saved = await secure.get(STORAGE_KEYS.deviceId)
  if (saved) {
    cached = saved
    return cached
  }
  cached = `${DEVICE_ID_PREFIX}${randomId()}`
  await secure.set(STORAGE_KEYS.deviceId, cached)
  return cached
}
