import { useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, Text, View } from 'react-native'
import { SPLASH } from '../../config'
import { useI18n } from '../../i18n'
import { colors } from '../../theme'
import { PulsingDots } from '../loading/PulsingDots'
import { useSplashVisibility } from './useSplashVisibility'

/**
 * หน้าเปิดแอปเต็มจอ 4K (ทีวี 55 นิ้ว) — ค่อยๆ จางหายเมื่อรายการช่องพร้อม
 * ไม่รับโฟกัส/การกด (pointerEvents none) รีโมตเลือกช่องได้ทันทีที่หายไป
 */
export function AppSplash({ ready }) {
  const { t } = useI18n()
  const visible = useSplashVisibility(ready, { minMs: SPLASH.minVisibleMs, maxMs: SPLASH.maxVisibleMs })
  const opacity = useRef(new Animated.Value(1)).current
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (visible) return
    Animated.timing(opacity, { toValue: 0, duration: SPLASH.fadeOutMs, useNativeDriver: true }).start(() => setMounted(false))
  }, [visible, opacity])

  if (!mounted) return null

  return (
    <Animated.View style={[styles.root, { opacity }]} pointerEvents="none">
      <Image source={SPLASH.image} style={styles.image} resizeMode="cover" />
      <View style={[styles.footer, { top: SPLASH.taglineTop }]}>
        <Text style={styles.tagline}>{t('splash.tagline')}</Text>
        <PulsingDots color={colors.gold} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.splashBg,
    zIndex: 20000,
    elevation: 20000,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 18,
  },
  tagline: {
    color: colors.splashTagline,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 3,
    textShadowColor: colors.textShadowHeavy,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
})
