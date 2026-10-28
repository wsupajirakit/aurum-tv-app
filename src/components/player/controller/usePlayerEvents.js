import { useEventListener } from 'expo'
import { PLAYER } from '../../../config'
import { logState, logWarn, logError } from '../../../services/logger'
import { TIMER } from './useTimerBag'

/** player เริ่มเล่นจริงครั้งแรก (แจ้งครั้งเดียว ป้ายช่องจะได้ไม่รีเซ็ต timer ค้าง) */
function markStarted({ refs, loadTimeout, onPlayStateChange }) {
  if (refs.hasStartedPlaying) return
  refs.hasStartedPlaying = true
  loadTimeout.clear()
  onPlayStateChange?.(true)
}

/**
 * ฟัง event ของ expo-video แล้วแปลงเป็นสถานะ
 *   statusChange → error = retry · readyToPlay = watchdog ปลดจอโหลด · loading/idle = ตรวจค้าง
 *   playingChange → heartbeat log / ตรวจค้างเมื่อหยุด
 *   timeUpdate   → ภาพขยับจริง = ปิดจอโหลด (อย่างน้อย minLoadingVisibleMs) + นับเล่นเสถียร reset retry
 */
export function usePlayerEvents(ctx, { triggerAutoReconnect, checkStallStatus }) {
  const { isMain, player, url, channel, error, refs, timers, setLoading, setError, onPlayStateChange, loadTimeout } = ctx

  useEventListener(player, 'statusChange', ({ status, error: err }) => {
    if (isMain) return

    if (status === 'error' || err) {
      const errMsg = err?.message || ''
      // BehindLiveWindow / Source error ต้องเข้า reconnect เสมอ ห้ามตัดวงจรการกู้
      if (errMsg.includes('Source error') || errMsg.includes('BehindLiveWindow')) {
        logWarn('BEHIND_LIVE_WINDOW_RECONNECT', 'Source error detected, triggering auto reconnect', {
          errMsg,
          url,
          currentTime: refs.lastPlaybackPosition,
        }, channel)
      }

      refs.hasStartedPlaying = false
      timers.clear(TIMER.stable)

      logError('PLAYER_STATUS_ERROR', `Status error: ${errMsg || status}`, err, {
        status,
        url,
        currentTime: refs.lastPlaybackPosition,
      }, channel)

      triggerAutoReconnect(errMsg || 'status-error')
    } else if (status === 'readyToPlay') {
      logState('PLAYER_READY_TO_PLAY', 'Media source prepared, readyToPlay', { status, url }, channel)
      setError(null)

      if (!player?.playing) {
        try {
          player.play()
        } catch {
          // ไม่เป็นไร รอ event ถัดไป
        }
      }

      // watchdog: readyToPlay แล้วแต่ภาพยังไม่ขยับ → ปลดจอโหลด ไม่ให้ค้าง
      timers.timeout(
        TIMER.safetyDismiss,
        () => {
          if (!isMain && !error) {
            logState('SAFETY_DISMISS_LOADING', `Clearing loading via safety watchdog (${PLAYER.safetyDismissMs}ms elapsed)`, {}, channel)
            markStarted({ refs, loadTimeout, onPlayStateChange })
            setLoading(false)
          }
        },
        PLAYER.safetyDismissMs,
      )
    } else if (status === 'loading') {
      if (!refs.hasStartedPlaying) setLoading(true)
      checkStallStatus()
    } else if (status === 'idle') {
      if (refs.hasStartedPlaying) checkStallStatus()
    }
  })

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isMain) return

    if (isPlaying) {
      setError(null)
      // ห้าม setLoading(false) ตรงนี้: playingChange มาก่อนเฟรมแรกถูกวาด 1.5-2.5 วิ
      // คงจอโหลดไว้จน timeUpdate ยืนยันว่าภาพขยับจริง
      timers.clear(TIMER.stall)

      if (!timers.has(TIMER.heartbeat)) {
        timers.interval(
          TIMER.heartbeat,
          () => {
            if (player?.playing && refs.hasStartedPlaying) {
              logState('PLAYING_HEARTBEAT', 'Stream is healthy and playing', {
                currentTime: refs.lastPlaybackPosition,
                isPlaying: true,
              }, channel)
            }
          },
          PLAYER.heartbeatLogMs,
        )
      }
    } else if (!error) {
      checkStallStatus()
    }
  })

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (isMain) return

    refs.lastProgressTime = Date.now()
    const hasProgress =
      currentTime > 0 || (refs.lastPlaybackPosition >= 0 && currentTime !== refs.lastPlaybackPosition)
    refs.lastPlaybackPosition = currentTime

    if (hasProgress) {
      timers.clear(TIMER.safetyDismiss)
      markStarted({ refs, loadTimeout, onPlayStateChange })

      // จอโหลดโชว์อย่างน้อยช่วงหนึ่ง ไม่กระพริบหายก่อนตาเห็น
      const remainingMinTime = Math.max(0, PLAYER.minLoadingVisibleMs - (Date.now() - refs.loadStartTime))
      if (remainingMinTime > 0) {
        if (!timers.has(TIMER.dismiss)) timers.timeout(TIMER.dismiss, () => setLoading(false), remainingMinTime)
      } else {
        setLoading(false)
      }
    }

    timers.clear(TIMER.stall)
    if (error) setError(null)

    // เล่นต่อเนื่องครบ stablePlaybackMs → reset ตัวนับ retry
    if (!timers.has(TIMER.stable) && refs.autoRetryCount > 0) {
      timers.timeout(
        TIMER.stable,
        () => {
          if (refs.hasStartedPlaying && player?.playing) {
            logState('PLAYBACK_STABLE_60S', 'Stream has played smoothly for 60s. Retry counter reset to 0.', {
              previousRetries: refs.autoRetryCount,
            }, channel)
            refs.autoRetryCount = 0
          }
        },
        PLAYER.stablePlaybackMs,
      )
    }
  })
}
