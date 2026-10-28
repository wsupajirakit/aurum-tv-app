import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LAYOUT } from '../../config'
import { useI18n } from '../../i18n'
import { colors } from '../../theme'
import { Avatar } from '../common/Avatar'
import { DualSpinRing } from './DualSpinRing'
import { PulsingDots } from './PulsingDots'
import { useLoop } from './useLoop'

const FADE_IN_MS = 180
const FADE_OUT_MS = 350
/** รับประกันว่าถอดออกแน่หลัง fade-out แม้ callback ของแอนิเมชันไม่มา */
const UNMOUNT_FALLBACK_MS = 400
const BREATHE_MS = 2200
const SWEEP_MS = 1400
const SWEEP_RANGE = 320

/** วงแหวน 3 ชั้นรอบโลโก้: นอกสีทอง · กลางสีฟ้า (หมุนกลับ) · ในสีขาว */
const RINGS = [
  { size: 280, thickness: 4.5, color: colors.gold, color2: colors.goldSoft, duration: 2400 },
  { size: 220, thickness: 3.5, color: colors.cyan, color2: colors.cyanGlow, duration: 3000, reverse: true },
  { size: 170, thickness: 2.5, color: colors.ringInner, color2: colors.transparent, duration: 1500 },
]

/** fade-in/out นุ่มนวล + ถอดออกจาก tree เมื่อซ่อนเสร็จ */
function useFade(visible) {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current
  const [rendered, setRendered] = useState(visible)

  useEffect(() => {
    let active = true
    let fallbackTimer = null

    if (visible) {
      setRendered(true)
      Animated.timing(fadeAnim, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        if (active) setRendered(false)
      })
      fallbackTimer = setTimeout(() => {
        if (active) setRendered(false)
      }, UNMOUNT_FALLBACK_MS)
    }

    return () => {
      active = false
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [visible, fadeAnim])

  return { fadeAnim, rendered }
}

/**
 * จอโหลดขนาดใหญ่กลางจอทีวี — บอกชัดว่ากำลังโหลดช่องไหน
 * fade-out เมื่อภาพวิดีโอมาจริง ไม่มีจอดำแม้เสี้ยววินาที
 */
export function LoadingOverlay({ channel, visible = true }) {
  const { t } = useI18n()
  const { fadeAnim, rendered } = useFade(visible)

  const breathe = useLoop(BREATHE_MS, { easing: Easing.inOut(Easing.ease) })
  const scale = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] })
  const glow = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.9, 0.4] })
  const pulse = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.1, 0.92] })

  const sweep = useLoop(SWEEP_MS, { easing: Easing.inOut(Easing.sin) })
  const sweepTranslateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-SWEEP_RANGE, SWEEP_RANGE] })

  if (!rendered) return null

  const groupText = channel?.group || t('loading.defaultGroup')
  const tint = colors.gold

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="none">
      <LinearGradient colors={colors.scrimDeep} style={StyleSheet.absoluteFill} />

      <View style={styles.dialogCard}>
        <View style={styles.badgePill}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeText}>
            {groupText.toUpperCase()} • {t('loading.liveBroadcast')}
          </Text>
        </View>

        <View style={styles.ringStack}>
          <Animated.View
            style={[
              styles.glow,
              { opacity: glow, transform: [{ scale: pulse }], backgroundColor: colors.goldGlow },
            ]}
          />
          {RINGS.map((ring) => (
            <DualSpinRing key={ring.size} {...ring} />
          ))}
          <Animated.View style={[styles.avatarWrap, { transform: [{ scale }] }]}>
            <Avatar channel={channel} size={LAYOUT.loadingAvatar} />
          </Animated.View>
        </View>

        {channel?.name ? (
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
        ) : null}

        <View style={styles.messageRow}>
          <Text style={styles.message}>
            {channel?.name ? t('loading.connectingTo', { name: channel.name }) : t('loading.connecting')}
          </Text>
          <PulsingDots color={tint} />
        </View>

        <View style={styles.statusBarWrap}>
          <Animated.View style={[styles.shimmerSweep, { transform: [{ translateX: sweepTranslateX }] }]}>
            <LinearGradient
              colors={[colors.transparent, tint, colors.transparent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -LAYOUT.playerInsetLeft, // ชดเชยระยะเว้นซ้ายของ player ให้อยู่กึ่งกลางจอพอดี
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  dialogCard: {
    width: 580,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dialog,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.cyanBorder,
    paddingVertical: 36,
    paddingHorizontal: 40,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 25,
  },
  ringStack: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    marginBottom: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.liveDot,
  },
  badgeText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  channelName: {
    marginTop: 20,
    color: colors.white,
    fontSize: 42,
    fontWeight: '900',
    maxWidth: 500,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: colors.textShadowHeavy,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  messageRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    color: colors.textSoft,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusBarWrap: {
    width: 320,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.track,
    marginTop: 22,
    overflow: 'hidden',
  },
  shimmerSweep: {
    width: 140,
    height: '100%',
  },
})
