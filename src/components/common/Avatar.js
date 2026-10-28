import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AVATAR_PALETTE, MAIN_AVATAR_COLORS, colors } from '../../theme'

const MAIN_LABEL = '★'
const FALLBACK_LABEL = 'TV'

function hash(text) {
  let h = 0
  for (let i = 0; i < text.length; i += 1) {
    h = (h << 5) - h + text.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** เลขช่องจากข้อมูล (channel.number) · ไม่มีเลข → ตัวอักษรแรกของชื่อ */
function getChannelLabel(channel) {
  if (!channel) return FALLBACK_LABEL
  if (channel.isMain) return MAIN_LABEL
  if (Number.isInteger(channel.number)) return String(channel.number)
  return [...String(channel.name || '').trim()][0]?.toUpperCase() || FALLBACK_LABEL
}

/** ขนาดตัวอักษรตามความยาว label — ตัวเลขช่องเด่นชัดเต็มตา */
function labelMetrics(label, size) {
  if (label.length <= 1) return { fontSize: Math.round(size * 0.7), lineHeight: Math.round(size * 0.78) }
  if (label.length === 2) return { fontSize: Math.round(size * 0.58), lineHeight: Math.round(size * 0.66) }
  return { fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.46) }
}

/** ไอคอนช่องจากเลขช่อง/ตัวอักษร คละสีตามชื่อ สไตล์ tvOS */
export function Avatar({ channel, size = 52 }) {
  const name = channel?.name || FALLBACK_LABEL
  const label = getChannelLabel(channel)
  const gradient = channel?.isMain ? MAIN_AVATAR_COLORS : AVATAR_PALETTE[hash(name) % AVATAR_PALETTE.length]
  const radius = Math.round(size * 0.32)
  const { fontSize, lineHeight } = labelMetrics(label, size)

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: radius }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.gradient, { borderRadius: radius }]}
      >
        <Text
          style={[styles.letter, { fontSize, lineHeight, letterSpacing: label.length === 2 ? -1 : -0.2 }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderBright,
  },
  letter: {
    color: colors.white,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    textShadowColor: colors.textShadow,
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
})
