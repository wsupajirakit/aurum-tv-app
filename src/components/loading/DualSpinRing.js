import { Animated, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import { useLoop } from './useLoop'

/** วงแหวนหมุนสองสี (ด้านบน/ซ้าย = color, ด้านขวา = color2) */
export function DualSpinRing({ size, thickness, color, color2, duration, reverse = false }) {
  const spin = useLoop(duration)
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  })
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderTopColor: color,
          borderRightColor: color2 || colors.transparent,
          borderBottomColor: colors.transparent,
          borderLeftColor: color || colors.transparent,
          transform: [{ rotate }],
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
})
