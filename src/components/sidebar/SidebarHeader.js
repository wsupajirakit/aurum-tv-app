import { StyleSheet, Text, View } from 'react-native'
import { useI18n } from '../../i18n'
import { colors } from '../../theme'
import { Clock } from '../common/Clock'

/** หัวแถบข้าง: ชื่อ + สถานะ/จำนวนช่อง + นาฬิกา (ย่อแล้วเหลือจุดสี) */
export function SidebarHeader({ collapsed, status, count }) {
  const { t } = useI18n()

  if (collapsed) {
    return (
      <View style={[styles.header, styles.headerCollapsed]}>
        <View style={styles.miniIcon}>
          <View style={styles.miniDot} />
        </View>
      </View>
    )
  }

  const subtitle =
    status === 'loading'
      ? t('sidebar.connecting')
      : status === 'error'
        ? t('sidebar.serverDown')
        : t('sidebar.channelCount', { count })

  return (
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {t('sidebar.title')}
        </Text>
        <Text
          style={[styles.subtitle, status === 'error' && styles.subtitleError, status === 'loading' && styles.subtitleLoading]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <Clock />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  miniIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 1,
    color: colors.textQuiet,
    fontSize: 10,
    fontWeight: '500',
  },
  subtitleError: {
    color: colors.danger,
    fontWeight: '700',
  },
  subtitleLoading: {
    color: colors.accent,
  },
})
