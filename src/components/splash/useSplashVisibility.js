import { useEffect, useRef, useState } from 'react'

/**
 * ตัดสินว่าเมื่อไรควรเริ่มซ่อน splash
 *   ready && โชว์ครบ minMs  → ซ่อน
 *   ยังไม่ ready แต่ครบ maxMs → ซ่อน (ไม่ให้ค้างหน้าเปิดตอนเน็ตล่ม)
 * คืน true = ยังโชว์อยู่ (ค่าเป็น false แล้วไม่กลับมา true อีก)
 */
export function useSplashVisibility(ready, { minMs, maxMs }) {
  const [visible, setVisible] = useState(true)
  const shownAt = useRef(Date.now())

  // เพดานเวลา — ตั้งครั้งเดียวตอน mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), maxMs)
    return () => clearTimeout(timer)
  }, [maxMs])

  // พร้อมแล้ว → รอให้ครบเวลาขั้นต่ำก่อนซ่อน
  useEffect(() => {
    if (!ready || !visible) return undefined
    const remaining = Math.max(0, minMs - (Date.now() - shownAt.current))
    const timer = setTimeout(() => setVisible(false), remaining)
    return () => clearTimeout(timer)
  }, [ready, visible, minMs])

  return visible
}
