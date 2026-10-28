import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * จับเวลาโหลดช่อง — เกินกำหนดแล้วภาพยังไม่มา → timedOut=true ให้ UI ถามผู้ใช้
 * แยก timer จาก watchdog อื่นของ player: auto-retry ระหว่างทางต้องไม่ล้างตัวนับนี้
 *
 * คืน { timedOut, controls } — controls เป็น object คงที่ (ใส่ใน deps ของ effect ได้ไม่ทำให้รันซ้ำ)
 */
export function useLoadTimeout(timeoutMs, onTimeout) {
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** เริ่มนับใหม่ (เลือกช่อง / กด OK ลองใหม่ / สตรีมหลุดระหว่างดู) */
  const start = useCallback(() => {
    cancel()
    setTimedOut(false)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setTimedOut(true)
      onTimeoutRef.current?.()
    }, timeoutMs)
  }, [cancel, timeoutMs])

  /** ภาพมาแล้ว หรือเปลี่ยนไปหน้าหลัก → หยุดนับและซ่อนข้อความ */
  const clear = useCallback(() => {
    cancel()
    setTimedOut(false)
  }, [cancel])

  const isRunning = useCallback(() => timerRef.current !== null, [])

  useEffect(() => cancel, [cancel])

  const controls = useMemo(() => ({ start, clear, isRunning }), [start, clear, isRunning])
  return { timedOut, controls }
}
