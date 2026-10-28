import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'
import { FocusButton } from '../common/FocusButton'

/**
 * แผ่นข้อความกลางจอ + ปุ่มเดียว (รีโมตโฟกัสปุ่มให้ทันที กด OK ได้เลย)
 * ใช้ทั้งตอนเล่นไม่ได้ และตอนโหลดเกินเวลา
 */
export function MessageOverlay({ title, name, message, actionLabel, onAction }) {
  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>{title}</Text>
      {name ? (
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
      <Text style={styles.message}>{message}</Text>
      <FocusButton label={actionLabel} onPress={onAction} preferFocus />
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    paddingHorizontal: 50,
    zIndex: 5,
  },
  title: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    marginTop: 14,
    color: colors.white,
    fontSize: 34,
    fontWeight: '700',
    maxWidth: 700,
    textAlign: 'center',
  },
  message: {
    marginTop: 14,
    color: colors.textSubtle,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },
})
