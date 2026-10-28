import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LAYOUT } from '../../config'
import { useI18n } from '../../i18n'
import { colors } from '../../theme'
import { Avatar } from './Avatar'

const SLIDE_FROM_Y = -46

/** ป้ายบอกช่องมุมขวาบน — โผล่ตอนเปลี่ยนช่อง ซ่อนเองเมื่อเล่นแล้ว */
export function ChannelBadge({ channel, visible }) {
  const { t } = useI18n()
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start()
  }, [visible, anim])

  if (!channel) return null

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SLIDE_FROM_Y, 0] })
  const live = t('badge.live')

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { opacity: anim, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={colors.badgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Avatar channel={channel} size={LAYOUT.badgeAvatar} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {channel.name}
        </Text>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{channel.group ? `${live} · ${channel.group}` : live}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 36,
    right: 48,
    maxWidth: 680,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderBadge,
    backgroundColor: colors.badgeBg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
    zIndex: 999,
  },
  info: {
    flexShrink: 1,
  },
  name: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  liveRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.live,
  },
  liveText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
})
