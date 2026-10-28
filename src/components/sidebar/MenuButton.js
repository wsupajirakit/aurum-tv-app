import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'
import { focusStyles } from './focusStyles'

/**
 * ปุ่มในเมนูบนสุดของแถบข้าง (รีโหลด / ตั้งค่า) — รองรับรีโมต D-pad และเมาส์ hover
 * ตอน sidebar ย่อแสดงแค่ไอคอน
 */
export function MenuButton({ icon, label, collapsed, busy = false, compact = false, onPress, onFocus }) {
  return (
    <Pressable
      focusable
      onFocus={onFocus}
      onHoverIn={onFocus}
      onPress={onPress}
      style={({ focused, hovered }) => [
        styles.button,
        compact && !collapsed && styles.buttonCompact,
        collapsed && styles.buttonCollapsed,
        (focused || hovered) && focusStyles.neon,
        busy && styles.buttonBusy,
      ]}
    >
      {({ focused, hovered }) => {
        const highlighted = Boolean(focused || hovered)
        return (
          <View style={[styles.inner, (collapsed || compact) && styles.innerIconOnly]}>
            <Text style={[styles.icon, highlighted && styles.iconFocused]}>{icon}</Text>
            {!collapsed && !compact && label ? (
              <View style={styles.labelWrap}>
                <Text style={[styles.label, highlighted && styles.labelFocused]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ) : null}
          </View>
        )
      }}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    cursor: 'pointer',
  },
  buttonCompact: {
    flex: 0,
    width: 40,
    alignItems: 'center',
  },
  buttonCollapsed: {
    flex: 0,
    width: 46,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: {
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  innerIconOnly: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    gap: 0,
  },
  icon: {
    fontSize: 15,
    color: colors.textIcon,
  },
  iconFocused: {
    color: colors.white,
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: colors.white,
    fontWeight: '800',
  },
})
