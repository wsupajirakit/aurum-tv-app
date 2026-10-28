import { SOURCE_STATUS } from '../../config/sources'

/**
 * อ่านแหล่งสตรีมของช่องจากข้อมูล backend — ฟังก์ชันบริสุทธิ์ทั้งหมด (ทดสอบได้ใน Node)
 * channel.sources: [{ id, label, url, resolver, priority, status }]
 */

const STATUS_RANK = { [SOURCE_STATUS.UP]: 0, [SOURCE_STATUS.UNKNOWN]: 1, [SOURCE_STATUS.DOWN]: 2 }

/** แหล่งที่ใช้ resolver ชนิดนั้น (ไม่มีคืน null) */
export function resolverSource(channel, resolver) {
  return channel?.sources?.find((s) => s.resolver === resolver) ?? null
}

export function hasResolver(channel, resolver) {
  return Boolean(resolverSource(channel, resolver))
}

/** เรียงแหล่งที่ลองเล่นได้: สถานะดีก่อน (up → unknown → down) แล้วตาม priority · ตัดแหล่งที่ไม่มี url */
export function rankSources(channel) {
  return (channel?.sources ?? [])
    .filter((s) => s.url)
    .slice()
    .sort((a, b) => (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1) || a.priority - b.priority)
}

/**
 * URL ถัดไปที่ควรลองเมื่อแหล่งปัจจุบันเล่นไม่ได้ — ข้ามแหล่งที่ลองแล้วในรอบนี้
 * ไม่มีแหล่งอื่นเหลือคืน null (ผู้เรียกตัดสินใจเองว่าจะทำอะไรต่อ)
 */
export function nextSourceUrl(channel, triedUrls) {
  return rankSources(channel).find((s) => !triedUrls.has(s.url))?.url ?? null
}

/** ช่องนี้มีแหล่งสำรองให้สลับไหม */
export function hasBackupSources(channel) {
  return rankSources(channel).length > 1
}
