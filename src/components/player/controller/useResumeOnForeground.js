import { useEffect } from 'react'
import { AppState } from 'react-native'
import { logState } from '../../../services/logger'

/** กลับจากสแตนด์บาย/พักหน้าจอ แล้วภาพไม่เล่น → สั่งเล่นต่อ (เล่นไม่ได้ → reconnect) */
export function useResumeOnForeground({ isMain, player, url, channel }, performReconnect) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || isMain || !player || !url) return
      logState('APP_STATE_ACTIVE', 'TV resumed from standby', {}, channel)
      if (!player.playing) {
        try {
          player.play()
        } catch {
          performReconnect(true)
        }
      }
    })
    return () => sub.remove()
  }, [isMain, player, url, performReconnect, channel])
}
