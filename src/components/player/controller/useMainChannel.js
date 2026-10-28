import { useEffect } from 'react'
import { logState } from '../../../services/logger'

/** ช่องหน้าหลัก (ภาพนิ่ง): ล้าง timer/สถานะทั้งหมด และถือว่า "เล่นอยู่" */
export function useMainChannel(ctx) {
  const { isMain, channel, timers, setLoading, setError, onPlayStateChange, loadTimeout } = ctx

  useEffect(() => {
    if (!isMain) return
    timers.clearAll()
    loadTimeout.clear()
    setLoading(false)
    setError(null)
    onPlayStateChange?.(true)
    logState('MAIN_STILL_CHANNEL_ACTIVE', 'Showing main still channel', {}, channel)
  }, [isMain, onPlayStateChange, timers, channel, loadTimeout, setLoading, setError])
}
