import { useCallback } from 'react'
import { PLAYER } from '../../../config'
import { logWarn } from '../../../services/logger'
import { TIMER } from './useTimerBag'

/**
 * ตรวจสตรีมค้าง: ไม่มีเฟรมขยับต่อเนื่องเกิน PLAYER.stallTimeoutMs และไม่ได้เล่นอยู่ → สั่ง reconnect
 * ไม่ตั้งเมื่อกำลัง reconnect หรือ retry ครบเพดานแล้ว (กันลูป)
 */
export function useStallWatcher(ctx, triggerAutoReconnect) {
  const { isMain, url, player, error, channel, refs, timers } = ctx

  return useCallback(() => {
    timers.clear(TIMER.stall)
    if (isMain || !url || refs.isReconnecting || refs.autoRetryCount >= PLAYER.maxAutoRetries) return

    timers.timeout(
      TIMER.stall,
      () => {
        const elapsedSinceProgress = Date.now() - refs.lastProgressTime
        if (elapsedSinceProgress >= PLAYER.stallTimeoutMs && !player?.playing && !error) {
          logWarn('PLAYBACK_STALL_CONFIRMED', `No playback progress for ${Math.round(elapsedSinceProgress / 1000)}s`, {
            elapsedMs: elapsedSinceProgress,
            lastPosition: refs.lastPlaybackPosition,
          }, channel)
          triggerAutoReconnect('stalled-no-progress-15s')
        }
      },
      PLAYER.stallTimeoutMs,
    )
  }, [isMain, url, player, error, triggerAutoReconnect, channel, refs, timers])
}
