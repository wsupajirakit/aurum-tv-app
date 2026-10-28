import { useCallback } from 'react'
import { PLAYER } from '../../../config'
import { useLoadTimeout } from '../../../hooks/useLoadTimeout'
import { logWarn } from '../../../services/logger'

/**
 * โหลดเกิน PLAYER.loadTimeoutMs แล้วภาพยังไม่มา → หยุด auto-retry ทั้งหมด, pause
 * แล้วรอผู้ใช้กด OK (โหลดใหม่) หรือเลือกช่องอื่น
 * คืน { timedOut, loadTimeout } — loadTimeout = { start, clear, isRunning } (identity คงที่)
 */
export function useLoadTimeoutGuard(ctx) {
  const { isMain, url, channel, player, refs, timers, setLoading, onPlayStateChange, onPlaybackFailure } = ctx

  const handleTimeout = useCallback(() => {
    if (isMain || refs.hasStartedPlaying) return
    logWarn('LOAD_TIMEOUT_PROMPT', `No picture within ${PLAYER.loadTimeoutMs}ms — waiting for user`, { url }, channel)
    timers.clearAll()
    refs.autoRetryCount = PLAYER.maxAutoRetries
    refs.isReconnecting = false
    setLoading(false)
    try {
      player?.pause()
    } catch {
      // player ถูกปล่อยไปแล้ว
    }
    onPlayStateChange?.(false)
    if (!refs.reportedThisLoad && onPlaybackFailure && channel?.id) {
      refs.reportedThisLoad = true
      onPlaybackFailure({ channelId: channel.id, url: refs.playingUrl, reason: 'load_timeout' })
    }
  }, [isMain, url, channel, timers, player, onPlayStateChange, onPlaybackFailure, refs, setLoading])

  const { timedOut, controls } = useLoadTimeout(PLAYER.loadTimeoutMs, handleTimeout)
  return { timedOut, loadTimeout: controls }
}
