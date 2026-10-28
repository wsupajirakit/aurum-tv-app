import { useEffect } from 'react'
import { BackHandler, StyleSheet, Text, TVFocusGuideView, View } from 'react-native'
import { SUPPORTED_LANGUAGES, useI18n } from '../../i18n'
import { colors } from '../../theme'
import { FocusButton } from '../common/FocusButton'

const CHECK = '✓ '

/**
 * หน้าตั้งค่า (เปิดจากปุ่ม ⚙️ บนสุดของแถบข้าง)
 * - เลือกภาษา EN / TH มีผลทันทีทั้งแอป และจำไว้ในเครื่อง
 * - โฟกัสรีโมตถูกขังไว้ในแผงนี้ · ปุ่ม Back ของรีโมตปิดแผง
 */
export function SettingsPanel({ visible, onClose }) {
  const { t, language, setLanguage } = useI18n()

  useEffect(() => {
    if (!visible) return undefined
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.()
      return true
    })
    return () => sub.remove()
  }, [visible, onClose])

  if (!visible) return null

  return (
    <View style={styles.backdrop}>
      <TVFocusGuideView style={styles.card} trapFocusUp trapFocusDown trapFocusLeft trapFocusRight>
        <Text style={styles.title}>⚙️ {t('settings.title')}</Text>

        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.options}>
          {SUPPORTED_LANGUAGES.map((code) => (
            <FocusButton
              key={code}
              label={`${code === language ? CHECK : ''}${t(`language.${code}`)}`}
              selected={code === language}
              preferFocus={code === language}
              onPress={() => setLanguage(code)}
              style={styles.option}
            />
          ))}
        </View>

        <FocusButton label={t('common.close')} onPress={onClose} style={styles.close} />
        <Text style={styles.hint}>{t('settings.hint')}</Text>
      </TVFocusGuideView>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    zIndex: 10000,
    elevation: 10000,
  },
  card: {
    width: 520,
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 40,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.cyanBorder,
    backgroundColor: colors.dialog,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '900',
  },
  sectionLabel: {
    marginTop: 28,
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  options: {
    flexDirection: 'row',
    gap: 18,
  },
  option: {
    marginTop: 14,
  },
  close: {
    marginTop: 30,
  },
  hint: {
    marginTop: 16,
    color: colors.textGhost,
    fontSize: 12,
    fontWeight: '600',
  },
})
