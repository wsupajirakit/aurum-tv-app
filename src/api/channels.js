import { apiRequest } from './client'

/** ดึงเฉพาะช่องที่เปิดใช้งาน เรียงตาม order ที่ตั้งไว้หลังบ้าน (ลำดับเป็นข้อมูล ไม่มีกฎพิเศษในแอป) */
export async function fetchChannels(cacheBust = false) {
  const qs = cacheBust ? `?enabled=true&_t=${Date.now()}` : '?enabled=true'
  const data = await apiRequest(`/api/channels${qs}`)
  const channels = Array.isArray(data?.channels) ? data.channels : []
  return { updatedAt: data?.updatedAt, channels }
}

/** ดึงข้อมูลช่องเดี่ยวสดๆ ใช้เมื่อสงสัยว่าลิงก์หมดอายุ */
export async function fetchChannel(id, { refresh = false } = {}) {
  if (!id) return null
  const qs = refresh ? `?refresh=true&_t=${Date.now()}` : `?_t=${Date.now()}`
  return apiRequest(`/api/channels/${id}${qs}`)
}

/** สั่ง backend ต่ออายุ token สตรีมของช่องทันที — endpoint พังถอยไปใช้ fetchChannel แบบ refresh */
export async function refreshChannel(id) {
  if (!id) return null
  try {
    const res = await apiRequest(`/api/channels/${id}/refresh`, { method: 'POST' })
    return res?.channel || res
  } catch {
    return fetchChannel(id, { refresh: true })
  }
}

/** ส่ง URL สดที่ resolve สำเร็จขึ้น backend ให้เครื่องอื่นได้ด้วย — พลาดไม่เป็นไร */
export async function syncChannelUrl(id, url) {
  if (!id || !url) return
  try {
    await apiRequest(`/api/channels/${id}/sync`, { method: 'POST', json: { url } })
  } catch {
    /* backend ต่ออายุเองได้อยู่แล้ว */
  }
}

/**
 * แจ้ง backend ว่าเล่นช่องนี้ไม่ได้ → เซิร์ฟเวอร์ตรวจแหล่งจริงแล้วสลับให้ทุกเครื่อง (ถ้ายืนยันว่าล่ม)
 * fire-and-forget: พลาดไม่เป็นไร แอปสลับแหล่งเองได้อยู่แล้ว
 */
export async function reportPlaybackFailure(id, { url, reason } = {}) {
  if (!id) return
  try {
    await apiRequest(`/api/channels/${id}/report`, { method: 'POST', json: { url, reason } })
  } catch {
    /* เซิร์ฟเวอร์ตรวจเองเป็นรอบอยู่แล้ว */
  }
}
