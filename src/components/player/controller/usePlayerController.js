/**
 * สมองของตัวเล่นวิดีโอ — ประกอบ hook ย่อยตามหน้าที่ (ลำดับการเรียก = ลำดับ effect ห้ามสลับ)
 *
 *   usePlaybackState      state ที่ UI เห็น + refs ภายใน
 *   useLivePlayer         สร้าง expo-video player
 *   useTimerBag           timer ทุกตัวของ player (ล้างได้ในคำสั่งเดียว)
 *   useLoadTimeoutGuard   ภาพไม่มาใน 15 วิ → หยุด retry รอผู้ใช้
 *   useReconnect          กู้สตรีมหลุด (backoff + เพดาน + สลับแหล่งสำรอง + แจ้ง backend)
 *   useStallWatcher       ตรวจภาพค้าง
 *   useMainChannel        ช่องภาพนิ่งหน้าหลัก
 *   usePlayerEvents       แปลง event ของ player เป็นสถานะ
 *   useChannelLoader      โหลดเมื่อเปลี่ยนช่อง/สั่ง reload
 *   useCh3KeepAlive       ต่ออายุ token ช่อง 3 ระหว่างดู
 *   useResumeOnForeground กลับจากสแตนด์บาย
 *
 * คืน { player, isMain, loading, error (PLAYER_ERROR.*), timedOut, manualRetry }
 * พฤติกรรมล็อกด้วย test/player/usePlayerController.spec.js (ไทม์ไลน์เทียบ snapshot)
 */
import { useCallback, useEffect } from 'react'
import { logState } from '../../../services/logger'
import { useCh3KeepAlive } from './useCh3KeepAlive'
import { useChannelLoader } from './useChannelLoader'
import { useLivePlayer } from './useLivePlayer'
import { useLoadTimeoutGuard } from './useLoadTimeoutGuard'
import { useMainChannel } from './useMainChannel'
import { usePlaybackState } from './usePlaybackState'
import { usePlayerEvents } from './usePlayerEvents'
import { useReconnect } from './useReconnect'
import { useResumeOnForeground } from './useResumeOnForeground'
import { useStallWatcher } from './useStallWatcher'
import { useTimerBag } from './useTimerBag'

export { PLAYER_ERROR } from './playerErrors'

/**
 * @param {{ channel, onPlayStateChange?, onRefreshChannel?, onPlaybackFailure? }} props
 *   onPlaybackFailure({ channelId, url, reason }) — แจ้งครั้งเดียวต่อการโหลดเมื่อเล่นไม่ได้ (ไม่ส่ง = ไม่แจ้ง)
 */
export function usePlayerController({ channel, onPlayStateChange, onRefreshChannel, onPlaybackFailure }) {
  const isMain = Boolean(channel?.isMain || channel?.type === 'image')
  const url = isMain ? null : channel?.url
  const loadEpoch = channel?._loadEpoch || 0

  const { loading, setLoading, error, setError, refs } = usePlaybackState({ channel, isMain, url, loadEpoch })
  const player = useLivePlayer(url)
  const timers = useTimerBag()

  const base = {
    isMain,
    url,
    loadEpoch,
    channel,
    player,
    error,
    refs,
    timers,
    setLoading,
    setError,
    onPlayStateChange,
    onRefreshChannel,
    onPlaybackFailure,
  }
  const { timedOut, loadTimeout } = useLoadTimeoutGuard(base)
  const ctx = { ...base, loadTimeout }

  const { performReconnect, triggerAutoReconnect } = useReconnect(ctx)
  const checkStallStatus = useStallWatcher(ctx, triggerAutoReconnect)

  useMainChannel(ctx)
  usePlayerEvents(ctx, { triggerAutoReconnect, checkStallStatus })
  useChannelLoader(ctx)
  useCh3KeepAlive(ctx)
  useResumeOnForeground(ctx, performReconnect)

  // unmount → ล้าง timer ทั้งหมด
  useEffect(() => () => timers.clearAll(), [timers])

  const manualRetry = useCallback(() => {
    logState('MANUAL_RETRY_CLICKED', 'User clicked manual retry button with remote', {}, channel)
    performReconnect(true)
  }, [performReconnect, channel])

  return { player, isMain, loading, error, timedOut, manualRetry }
}
