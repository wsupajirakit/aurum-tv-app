import { StyleSheet, Text, View } from 'react-native'
import { LAYOUT } from '../../config'
import { describeError, useI18n } from '../../i18n'
import { colors } from '../../theme'
import { FocusButton } from '../common/FocusButton'
import { RowSkeleton } from '../loading'

/** สถานะเหนือรายการช่อง: แจ้งต่อเซิร์ฟเวอร์ไม่ได้ · โครงร่างตอนโหลด · รายการว่าง */
export function ListStatus({ status, error, collapsed, isEmpty, onRetry }) {
  const { t } = useI18n()
  const errorText = describeError(error, t)

  return (
    <>
      {status === 'error' && !collapsed ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText} numberOfLines={2}>
            {errorText || t('sidebar.errorNotice')}
          </Text>
        </View>
      ) : null}

      {status === 'loading' && isEmpty ? (
        <View style={styles.skeletons}>
          {Array.from({ length: LAYOUT.sidebar.skeletonRows }, (_, index) => (
            <RowSkeleton key={index} index={index} />
          ))}
        </View>
      ) : null}

      {status === 'error' && isEmpty ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{t('sidebar.emptyErrorTitle')}</Text>
          <Text style={styles.emptyText} numberOfLines={2}>
            {errorText}
          </Text>
          <FocusButton label={t('common.retry')} onPress={() => onRetry?.()} variant="small" />
        </View>
      ) : null}

      {status !== 'error' && status !== 'loading' && isEmpty ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{t('sidebar.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('sidebar.emptyText')}</Text>
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  notice: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.dangerTint,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  noticeText: {
    color: colors.dangerText,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  skeletons: {
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  emptyBox: {
    paddingHorizontal: 10,
    paddingTop: 16,
    gap: 6,
  },
  emptyTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
  },
})
