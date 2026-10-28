/**
 * ต่ออายุสตรีมช่อง 3 อัตโนมัติ (ศูนย์กลางเดียวของแอป)
 *
 * - ถูกเรียกจาก getlist / เลือกช่อง / เลื่อน-กาง-ย่อ sidebar / player
 * - มี in-flight dedup + throttle กันยิง network ซ้ำตอนกดรีโมตรัวๆ
 * - ได้ URL ใหม่ → sync ขึ้น backend + แจ้งทุก component ผ่าน onCh3UrlUpdated
 */
import { CH3 } from '../../config'
import { refreshChannel, syncChannelUrl } from '../../api/channels'
import { logState, logWarn } from '../logger'
import { isCh3 } from './detect'
import { expiresAtOrAssumed, isUrlExpiring, nowSec } from './expiry'
import { fetchFreshCh3StreamDirect } from './source'
import { notifyCh3Updated } from './events'
import { nextSourceUrl } from '../sources/channelSources'

let cachedUrl = null
let cachedExpiresAt = 0
let lastRenewAt = 0
let inFlight = null

/** URL สดที่แคชไว้ล่าสุด */
export function getCh3CachedUrl() {
  return cachedUrl
}

function remember(url) {
  cachedUrl = url
  cachedExpiresAt = expiresAtOrAssumed(url)
}

async function fetchFresh({ channelId, trigger }) {
  // 1. ดึงจากเว็บต้นทางตรงๆ ก่อน (IP บ้านในไทย)
  let freshUrl = null
  try {
    freshUrl = await fetchFreshCh3StreamDirect()
    if (freshUrl) remember(freshUrl)
  } catch (err) {
    logWarn('CH3_DIRECT_RENEW_FAILED', `ดึงจาก ch3plus ไม่สำเร็จ: ${err?.message}`, { trigger })
  }

  // 2. ไม่ได้ → ให้ backend ต่ออายุให้
  if (!freshUrl && channelId) {
    try {
      const backendChannel = await refreshChannel(channelId)
      if (backendChannel?.url && !isUrlExpiring(backendChannel.url, CH3.backendUrlMinSec)) {
        freshUrl = backendChannel.url
      }
    } catch (err) {
      logWarn('CH3_BACKEND_RENEW_FAILED', `ดึงจาก backend refresh ไม่สำเร็จ: ${err?.message}`, { trigger })
    }
  }
  return freshUrl
}

export async function renewCh3Auto({ channel = null, channelId = null, currentUrl = null, trigger = 'manual', force = false } = {}) {
  // ส่ง channel มาแต่ไม่ใช่ช่อง 3 → ข้าม
  if (channel && !isCh3(channel)) return currentUrl || channel?.url

  // ไม่ force + เพิ่งต่ออายุไป + cache ยังสด → คืน cache ทันที
  if (
    !force &&
    Date.now() - lastRenewAt < CH3.renewThrottleMs &&
    cachedUrl &&
    cachedExpiresAt > nowSec() + CH3.cacheMinRemainingSec
  ) {
    return cachedUrl
  }

  // dedup: มีงานต่ออายุค้างอยู่ → ใช้ผลเดียวกัน
  if (inFlight) return inFlight

  inFlight = (async () => {
    const startMs = Date.now()
    logState('CH3_AUTO_RENEW_TRIGGER', `เริ่มต่ออายุสตรีมช่อง 3 อัตโนมัติ (${trigger})`, {
      trigger,
      force,
      channelId,
      hasCached: Boolean(cachedUrl),
    })

    const freshUrl = await fetchFresh({ channelId, trigger })

    if (freshUrl && !isUrlExpiring(freshUrl, CH3.cacheMinRemainingSec)) {
      lastRenewAt = Date.now()
      remember(freshUrl)

      // sync ให้เครื่องอื่นในบ้าน — กัน sync ผิดช่อง: ต้องเป็นช่อง 3 (backend มี guard อีกชั้น)
      if (channelId && (!channel || isCh3(channel))) syncChannelUrl(channelId, freshUrl).catch(() => {})

      notifyCh3Updated(freshUrl, channelId)
      logState('CH3_AUTO_RENEW_SUCCESS', `ต่ออายุช่อง 3 สำเร็จ (${trigger}) ใน ${Date.now() - startMs}ms`, {
        trigger,
        url: freshUrl,
        expiresAt: new Date(cachedExpiresAt * 1000).toISOString(),
      })
      return freshUrl
    }

    // 3. ล้มเหลว → ใช้ cache เดิมถ้ายังไม่หมดอายุ
    if (cachedUrl && !isUrlExpiring(cachedUrl, 0)) return cachedUrl
    return currentUrl
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

/** ต่ออายุแบบ fire-and-forget (ไม่บล็อก UI) */
export function triggerCh3AutoRenew(trigger = 'event', options = {}) {
  renewCh3Auto({ trigger, ...options }).catch(() => {})
}

/**
 * คืน URL ที่พร้อมเล่นเสมอ — ช่องอื่นคืน URL เดิม · ช่อง 3 ต่ออายุเมื่อจำเป็น
 * ต่ออายุไม่ได้ทุกทางและ token หมดแล้ว → สลับไปแหล่งสำรองของช่อง (channel.sources) ไม่ให้จอดำ
 */
export async function resolveStreamUrl(channel, { forceRefresh = false, trigger = 'resolve' } = {}) {
  if (!channel || !channel.url) return channel?.url || null
  if (!isCh3(channel)) return channel.url

  if (!forceRefresh && cachedUrl && cachedExpiresAt > nowSec() + CH3.cacheFreshSec) return cachedUrl
  if (!forceRefresh && !isUrlExpiring(channel.url, CH3.urlFreshSec)) return channel.url

  const renewed = await renewCh3Auto({
    channel,
    channelId: channel.id,
    currentUrl: channel.url,
    trigger,
    force: forceRefresh,
  })
  if (renewed && !isUrlExpiring(renewed, 0)) return renewed

  if (isUrlExpiring(channel.url, 0)) {
    const backup = nextSourceUrl(channel, new Set([channel.url]))
    if (backup) {
      logWarn('STREAM_FALLBACK_TO_BACKUP', 'Token หมดอายุและต่ออายุไม่ได้ สลับไปแหล่งสำรองของช่อง', { backupUrl: backup }, channel)
      return backup
    }
  }
  return channel.url
}
