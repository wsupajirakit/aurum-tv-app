import { useMemo, useRef } from 'react'

/**
 * รวม timer ทุกตัวของ player ไว้ในถุงเดียว ตั้งชื่อได้ — ล้างทีละตัวหรือทั้งหมดในคำสั่งเดียว
 * ตัวที่ทำงานจบแล้วถูกถอดออกจากถุงก่อนเรียก callback (has(name) จึงบอกได้ว่า "ยังรออยู่ไหม")
 */
export function useTimerBag() {
  const bag = useRef(new Map()).current

  return useMemo(() => {
    const clear = (name) => {
      const entry = bag.get(name)
      if (!entry) return
      if (entry.kind === 'interval') clearInterval(entry.id)
      else clearTimeout(entry.id)
      bag.delete(name)
    }
    return {
      /** ตั้ง timeout ชื่อ name (มีอยู่แล้วจะถูกแทน) */
      timeout(name, fn, ms) {
        clear(name)
        const id = setTimeout(() => {
          bag.delete(name)
          fn()
        }, ms)
        bag.set(name, { id, kind: 'timeout' })
      },
      interval(name, fn, ms) {
        clear(name)
        bag.set(name, { id: setInterval(fn, ms), kind: 'interval' })
      },
      has: (name) => bag.has(name),
      clear,
      clearAll() {
        for (const name of [...bag.keys()]) clear(name)
      },
    }
  }, [bag])
}

/** ชื่อ timer ของ player — ใช้ค่าคงที่กันพิมพ์ผิด */
export const TIMER = {
  retry: 'retry',
  stall: 'stall',
  stable: 'stable',
  heartbeat: 'heartbeat',
  safetyDismiss: 'safetyDismiss',
  dismiss: 'dismiss',
}
