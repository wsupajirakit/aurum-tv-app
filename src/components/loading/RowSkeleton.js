import { Animated, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, theme } from '../../theme'
import { useLoop } from './useLoop'

const SWEEP_MS = 1400
const FADE_PER_ROW = 0.13

/** โครงร่างแถวช่องตอนยังโหลดรายการไม่เสร็จ — มีแถบแสงวิ่งผ่าน */
export function RowSkeleton({ index = 0 }) {
  const sweep = useLoop(SWEEP_MS)
  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-theme.size.sidebarWidth, theme.size.sidebarWidth],
  })

  return (
    <View style={[styles.row, { opacity: 1 - index * FADE_PER_ROW }]}>
      <View style={styles.logo} />
      <View style={styles.text}>
        <View style={[styles.line, { width: '72%' }]} />
        <View style={[styles.line, styles.lineSmall, { width: '40%' }]} />
      </View>
      <Animated.View style={[styles.sweep, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[colors.transparent, colors.surfaceShimmer, colors.transparent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    height: theme.size.rowHeight,
    marginBottom: 10,
    borderRadius: theme.size.radius,
    backgroundColor: theme.color.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  logo: {
    width: theme.size.logo,
    height: theme.size.logo,
    borderRadius: theme.size.logo * 0.28,
    backgroundColor: colors.surfaceShimmer,
  },
  text: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceStrong,
  },
  lineSmall: {
    height: 9,
  },
  sweep: {
    ...StyleSheet.absoluteFillObject,
  },
})
