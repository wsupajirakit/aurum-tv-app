import { StyleSheet } from 'react-native'
import { colors } from '../../theme'

/** ไฮไลต์นีออนตอนโฟกัส/hover — ใช้ร่วมทุกปุ่มในแถบข้าง ให้หน้าตาเหมือนกัน */
export const focusStyles = StyleSheet.create({
  neon: {
    backgroundColor: colors.focusFill,
    borderColor: colors.focusRing,
    borderWidth: 4,
    shadowColor: colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 18,
  },
})
