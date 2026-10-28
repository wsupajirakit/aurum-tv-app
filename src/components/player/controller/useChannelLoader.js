import { useEffect } from 'react'
import { logState, logError } from '../../../services/logger'
import { isCh3, renewCh3Auto } from '../../../services/ch3'

/**
 * โหลดสตรีมเมื่อเปลี่ยนช่อง / สั่ง reload (_loadEpoch) / URL เปลี่ยน
 * ช่องเดิมที่กำลังเล่นดีอยู่ แล้ว URL ถูกต่ออายุเบื้องหลัง → จำ URL ใหม่เงียบๆ ไม่ขัดจังหวะผู้ชม
 */
export function useChannelLoader(ctx) {
  const { isMain, player, url, loadEpoch, channel, refs, timers, setLoading, setError, loadTimeout } = ctx

  useEffect(() => {
    if (isMain) {
      refs.currentUrl = null
      refs.currentEpoch = loadEpoch
      timers.clearAll()
      return
    }
    if (!player || !url) return

    const channelChanged = refs.currentPlayingChannelId !== channel?.id
    const urlChanged = refs.currentUrl !== url
    const forceReloadRequested = refs.currentEpoch !== loadEpoch
    if (!channelChanged && !urlChanged && !forceReloadRequested) return

    if (!channelChanged && !forceReloadRequested && refs.hasStartedPlaying) {
      refs.currentUrl = url
      refs.playingUrl = url
      return
    }

    logState('CHANNEL_LOAD_INITIATED', `Loading channel: ${channel?.name}`, {
      channelChanged,
      urlChanged,
      forceReloadRequested,
      url,
    }, channel)

    refs.currentPlayingChannelId = channel?.id
    refs.currentUrl = url
    refs.currentEpoch = loadEpoch
    refs.autoRetryCount = 0
    refs.hasStartedPlaying = false
    refs.loadStartTime = Date.now()
    refs.lastPlaybackPosition = -1
    refs.playingUrl = url
    refs.triedUrls = new Set()
    refs.reportedThisLoad = false
    timers.clearAll()

    // เริ่มเล่น/เปลี่ยนมาช่อง 3 → ต่ออายุล่วงหน้าทันที
    if (isCh3(channel)) {
      renewCh3Auto({ channel, channelId: channel?.id, currentUrl: url, trigger: 'player_channel_load' }).catch(() => {})
    }

    setLoading(true)
    setError(null)
    loadTimeout.start()
    try {
      player.replace({ uri: url })
      player.play()
    } catch (e) {
      logError('CHANNEL_LOAD_ERROR', 'Error replacing player uri', e, {}, channel)
    }
  }, [isMain, player, url, loadEpoch, channel, timers, loadTimeout, refs, setLoading, setError])
}
