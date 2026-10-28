import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors } from '../../theme'

const DOT_STEP_MS = 160
const DOT_FADE_MS = 320
const DOT_COUNT = 4

function Dot({ delay, color }) {
  const value = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: 1, duration: DOT_FADE_MS, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: DOT_FADE_MS, useNativeDriver: true }),
        Animated.delay(DOT_STEP_MS * 3 - delay),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [delay, value])

  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] })
  return <Animated.View style={[styles.dot, { backgroundColor: color || colors.gold, opacity, transform: [{ scale }] }]} />
}

/** จุดกระพริบไล่กัน บอกว่ากำลังทำงาน */
export function PulsingDots({ color }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <Dot key={index} delay={index * DOT_STEP_MS} color={color} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
})
