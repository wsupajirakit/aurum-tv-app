import { useCallback } from 'react'
import { PLAYER } from '../../../config'
import { logState, logWarn, logError } from '../../../services/logger'
import { resolveStreamUrl, isUrlExpiring } from '../../../services/ch3'
import { hasBackupSources, nextSourceUrl } from '../../../services/sources'
import { PLAYER_ERROR } from './playerErrors'
import { TIMER } from './useTimerBag'

/**
 * กู้สตรีมเมื่อหลุด
 * - performReconnect: ขอ URL ที่พร้อมเล่น → URL นั้นพังไปแล้วและช่องมีแหล่งสำรอง → สลับแหล่ง
 *   (ไม่มีแหล่งสำรอง: ครั้งที่ 2 ขึ้นไปถาม backend) แล้ว replace
 * - แจ้ง backend ครั้งเดียวต่อการโหลด (onPlaybackFailure) ให้เซิร์ฟเวอร์ตรวจจริงและสลับให้ทุกเครื่อง
 * - triggerAutoReconnect: ตั้งคิว retry แบบหน่วงเพิ่มทีละขั้น มีเพดาน PLAYER.maxAutoRetries ไม่ติดลูป
 */
export function useReconnect(ctx) {
  const {
    isMain,
    player,
    url,
    channel,
    refs,
    timers,
    setLoading,
    setError,
    onPlayStateChange,
    onRefreshChannel,
    onPlaybackFailure,
    loadTimeout,
  } = ctx

  const performReconnect = useCallback(
    async (isManual = false) => {
      if (isMain || !player) return
      timers.clearAll()

      if (isManual) {
        refs.autoRetryCount = 0
        loadTimeout.start()
      }

      setLoading(true)
      setError(null)
      refs.isReconnecting = true
      refs.hasStartedPlaying = false

      logState('RECONNECT_EXECUTING', `Executing reconnect (attempt ${refs.autoRetryCount}/${PLAYER.maxAutoRetries})`, {
        isManual,
        currentAttempt: refs.autoRetryCount,
        url,
      }, channel)

      // ขอ URL ที่พร้อมเล่นเสมอ (เช่น token ByteArk หมดอายุ)
      let targetUrl = url
      try {
        targetUrl = await resolveStreamUrl(channel, {
          forceRefresh: refs.autoRetryCount >= PLAYER.forceResolveFromAttempt || isUrlExpiring(url, PLAYER.reconnectRefreshBelowSec),
        })
      } catch (err) {
        logError('RESOLVE_URL_RECONNECT_ERROR', `Error resolving URL: ${err?.message}`, err, {}, channel)
      }

      // URL นี้เพิ่งพังไปแล้ว และช่องมีแหล่งสำรอง → สลับไปแหล่งถัดไปที่ยังไม่ได้ลอง (เรียงตามสถานะจาก backend)
      let switchedSource = false
      if (
        hasBackupSources(channel) &&
        refs.autoRetryCount >= PLAYER.switchSourceFromAttempt &&
        refs.triedUrls.has(targetUrl)
      ) {
        const next = nextSourceUrl(channel, refs.triedUrls)
        if (next) {
          logWarn('SOURCE_FAILOVER', 'Switching to the next stream source', { from: targetUrl, to: next }, channel)
          targetUrl = next
          switchedSource = true
        } else {
          // ลองครบทุกแหล่งแล้ว → เริ่มวนใหม่รอบหน้า
          refs.triedUrls = new Set()
        }
      }

      // ไม่มีแหล่งให้สลับ แต่ลองหลายรอบแล้ว → ถาม backend เผื่อลิงก์เดิมหมดอายุ
      if (!switchedSource && refs.autoRetryCount >= PLAYER.backendRefreshFromAttempt && onRefreshChannel && channel?.id) {
        try {
          const fresh = await onRefreshChannel(channel.id)
          if (fresh?.url && !isUrlExpiring(fresh.url, PLAYER.reconnectRefreshBelowSec)) {
            targetUrl = fresh.url
          }
        } catch {
          // backend ไม่ตอบ ใช้ url เดิมต่อ
        }
      }

      if (!targetUrl) {
        setLoading(false)
        refs.isReconnecting = false
        setError(PLAYER_ERROR.noUrl)
        onPlayStateChange?.(false)
        logError('RECONNECT_FAILED_NO_URL', 'Target URL is missing', null, {}, channel)
        return
      }

      try {
        player.replace({ uri: targetUrl })
        player.play()
        refs.playingUrl = targetUrl
        refs.lastProgressTime = Date.now()
        refs.lastPlaybackPosition = -1
      } catch (e) {
        logError('RECONNECT_EXCEPTION', 'Exception while calling player.replace()', e, {}, channel)
      } finally {
        refs.isReconnecting = false
      }
    },
    [isMain, player, url, onRefreshChannel, channel, timers, onPlayStateChange, loadTimeout, refs, setLoading, setError],
  )

  const triggerAutoReconnect = useCallback(
    (reason) => {
      if (isMain || !url || !player) return

      // มีคิว retry รออยู่แล้ว หรือกำลัง replace อยู่ → ห้ามยิงซ้ำ
      if (timers.has(TIMER.retry) || refs.isReconnecting) return

      // ครบเพดานแล้ว → หยุดสนิท ไม่ trigger ซ้ำ
      if (refs.autoRetryCount >= PLAYER.maxAutoRetries) {
        setLoading(false)
        return
      }

      // จำว่า URL นี้พังในการโหลดครั้งนี้ + แจ้ง backend ครั้งเดียว
      refs.triedUrls.add(refs.playingUrl)
      if (!refs.reportedThisLoad && onPlaybackFailure && channel?.id) {
        refs.reportedThisLoad = true
        onPlaybackFailure({ channelId: channel.id, url: refs.playingUrl, reason })
      }

      const retryIndex = refs.autoRetryCount
      const delay = PLAYER.retryDelaysMs[retryIndex] || PLAYER.fallbackRetryDelayMs
      refs.autoRetryCount += 1
      refs.isReconnecting = true

      logWarn('AUTO_RECONNECT_SCHEDULED', `Scheduling reconnect in ${delay}ms (attempt ${refs.autoRetryCount}/${PLAYER.maxAutoRetries})`, {
        attempt: refs.autoRetryCount,
        maxRetries: PLAYER.maxAutoRetries,
        delayMs: delay,
        reason,
      }, channel)

      setLoading(true)
      // สตรีมหลุดระหว่างดู → เริ่มนับเวลาโหลดใหม่ ภาพไม่กลับมาในกำหนดจะถามผู้ใช้
      if (!loadTimeout.isRunning()) loadTimeout.start()
      timers.timeout(TIMER.retry, () => performReconnect(false), delay)
    },
    [isMain, url, player, performReconnect, channel, loadTimeout, timers, refs, setLoading, onPlaybackFailure],
  )

  return { performReconnect, triggerAutoReconnect }
}
