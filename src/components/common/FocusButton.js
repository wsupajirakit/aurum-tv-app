import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'

/**
 * ปุ่มที่ใช้ได้ทั้งรีโมต (focus) และเมาส์/air-mouse (hover)
 * variant: 'large' = ปุ่มกลางจอ (player) · 'small' = ปุ่มในแถบข้าง
 */
export function FocusButton({ label, onPress, variant = 'large', preferFocus = false, style, selected = false }) {
  const v = VARIANTS[variant] || VARIANTS.large
  return (
    <Pressable focusable hasTVPreferredFocus={preferFocus} onPress={onPress} style={[v.pressable, style]}>
      {({ focused, hovered }) => {
        const highlighted = Boolean(focused || hovered)
        return (
          <View style={[v.inner, selected && v.innerSelected, highlighted && v.innerFocused]}>
            <Text style={[v.text, highlighted && v.textFocused]}>{label}</Text>
          </View>
        )
      }}
    </Pressable>
  )
}

const large = StyleSheet.create({
  pressable: {
    marginTop: 32,
    cursor: 'pointer',
  },
  inner: {
    paddingHorizontal: 38,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceStrong,
  },
  innerSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
  },
  innerFocused: {
    borderColor: colors.white,
    backgroundColor: colors.surfacePressed,
    transform: [{ scale: 1.08 }],
  },
  text: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  textFocused: {
    color: colors.white,
    fontWeight: '800',
  },
})

const small = StyleSheet.create({
  pressable: {
    marginTop: 8,
    alignSelf: 'flex-start',
    cursor: 'pointer',
  },
  inner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: colors.surfaceStrong,
  },
  innerSelected: {
    borderColor: colors.accent,
  },
  innerFocused: {
    borderColor: colors.focusRing,
    borderWidth: 2,
    backgroundColor: colors.focusFill,
    shadowColor: colors.focusRing,
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  textFocused: {
    color: colors.white,
  },
})

const VARIANTS = { large, small }
