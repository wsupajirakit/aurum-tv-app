import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

/** วนค่า 0→1 ไม่รู้จบ — ฐานของการหมุน การเต้น และแถบไล่แสง */
export function useLoop(duration, { easing = Easing.linear } = {}) {
  const value = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: true }))
    animation.start()
    return () => animation.stop()
  }, [duration, easing, value])
  return value
}
