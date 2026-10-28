import { StyleSheet, View } from 'react-native'
import { useI18n } from '../../i18n'
import { MenuButton } from './MenuButton'

const ICON = { reload: '🔄', busy: '⏳', settings: '⚙️' }

/**
 * เมนูบนสุดของแถบข้าง: [รีโหลดช่อง] [⚙️ ตั้งค่า]
 * จากช่องแรกกดขึ้นจะมาที่รีโหลด กดขวาไปที่ฟันเฟือง
 */
export function TopMenu({ collapsed, loading, onReload, onOpenSettings, onExpand }) {
  const { t } = useI18n()
  return (
    <View style={[styles.bar, collapsed && styles.barCollapsed]}>
      <MenuButton
        icon={loading ? ICON.busy : ICON.reload}
        label={loading ? t('sidebar.reloading') : t('sidebar.reload')}
        collapsed={collapsed}
        busy={loading}
        onFocus={onExpand}
        onPress={() => {
          onExpand?.()
          onReload?.()
        }}
      />
      <MenuButton
        icon={ICON.settings}
        label={t('sidebar.settings')}
        collapsed={collapsed}
        compact
        onFocus={onExpand}
        onPress={onOpenSettings}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  barCollapsed: {
    flexDirection: 'column',
    paddingHorizontal: 6,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
})
