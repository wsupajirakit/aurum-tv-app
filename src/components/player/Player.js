import { StyleSheet, View } from 'react-native'
import { VideoView } from 'expo-video'
import { useI18n } from '../../i18n'
import { colors } from '../../theme'
import { LoadingOverlay } from '../loading'
import { MainStill } from './MainStill'
import { MessageOverlay } from './MessageOverlay'
import { usePlayerController, PLAYER_ERROR } from './controller'

/**
 * ตัวเล่นวิดีโอ + จอภาพนิ่งหน้าหลัก (ตรรกะทั้งหมดอยู่ใน usePlayerController)
 *   loading   → จอโหลด
 *   timedOut  → "กรุณากด ตกลง หรือเลือกช่องอื่น" (OK = โหลดช่องนี้ใหม่)
 *   error     → เล่นช่องนี้ไม่ได้ + ปุ่มลองใหม่
 */
export function Player({ channel, onPlayStateChange, onRefreshChannel, onPlaybackFailure }) {
  const { t } = useI18n()
  const { player, isMain, loading, error, timedOut, manualRetry } = usePlayerController({
    channel,
    onPlayStateChange,
    onRefreshChannel,
    onPlaybackFailure,
  })

  if (isMain) return <MainStill />

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      <LoadingOverlay channel={channel} visible={loading && !error && !timedOut} />

      {timedOut && !error ? (
        <MessageOverlay
          title={t('player.timeoutTitle')}
          name={channel?.name}
          message={t('player.timeoutMessage')}
          actionLabel={t('common.ok')}
          onAction={manualRetry}
        />
      ) : null}

      {error ? (
        <MessageOverlay
          title={t('player.errorTitle')}
          name={channel?.name}
          message={t(error === PLAYER_ERROR.noUrl ? 'player.noUrl' : 'player.signalLost')}
          actionLabel={t('common.retry')}
          onAction={manualRetry}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
})
