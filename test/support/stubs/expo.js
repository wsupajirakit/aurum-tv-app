import { useEffect, useRef } from 'react'

/** เหมือน expo/src/hooks/useEvent.ts: ใช้ listener ล่าสุดเสมอ สมัครใหม่เมื่อ emitter เปลี่ยน */
export function useEventListener(eventEmitter, eventName, listener) {
  const listenerRef = useRef(listener)
  listenerRef.current = listener
  useEffect(() => {
    const callback = (...args) => listenerRef.current(...args)
    const subscription = eventEmitter.addListener(eventName, callback)
    return () => subscription.remove()
  }, [eventEmitter, eventName, listenerRef])
}
