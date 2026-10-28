import { useCallback, useEffect, useRef, useState } from 'react'
import { TIMING } from '../config'

/** ป้ายชื่อช่องมุมจอ: โผล่ตอนเปลี่ยนช่อง แล้วซ่อนเองเมื่อครบเวลา/ภาพเริ่มเล่น */
export function useChannelBadge() {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const hideAfter = useCallback((ms) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), ms)
  }, [])

  const showBriefly = useCallback(() => {
    setVisible(true)
    hideAfter(TIMING.badgeVisibleMs)
  }, [hideAfter])

  /** player เริ่มเล่นแล้ว → ซ่อนเร็วขึ้น */
  const onPlayStateChange = useCallback(
    (isPlaying) => {
      if (isPlaying) hideAfter(TIMING.badgeHideAfterPlayMs)
    },
    [hideAfter],
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { visible, showBriefly, onPlayStateChange }
}
