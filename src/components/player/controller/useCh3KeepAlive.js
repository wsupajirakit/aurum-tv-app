import { useEffect } from 'react'
import { PLAYER } from '../../../config'
import { isCh3, isUrlExpiring, renewCh3Auto } from '../../../services/ch3'

/** ดูช่อง 3 ยาวๆ → ตรวจอายุ token เป็นระยะ ใกล้หมดต่ออายุล่วงหน้า สตรีมไม่ขาดตอน */
export function useCh3KeepAlive({ isMain, channel, refs }) {
  useEffect(() => {
    if (isMain || !isCh3(channel)) return undefined
    const interval = setInterval(() => {
      if (isUrlExpiring(refs.currentUrl, PLAYER.ch3ProactiveRenewBelowSec)) {
        renewCh3Auto({
          channelId: channel?.id,
          currentUrl: refs.currentUrl,
          trigger: 'player_heartbeat_proactive',
          force: true,
        }).catch(() => {})
      }
    }, PLAYER.ch3ProactiveCheckMs)
    return () => clearInterval(interval)
  }, [isMain, channel, refs])
}
