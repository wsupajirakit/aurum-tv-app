import { useVideoPlayer } from 'expo-video'
import { PLAYER } from '../../../config'

/** สร้าง expo-video player สำหรับ live HLS (ช่องหน้าหลักไม่มี url → player ว่าง) */
export function useLivePlayer(url) {
  return useVideoPlayer(url ? { uri: url } : null, (instance) => {
    instance.loop = false
    instance.timeUpdateEventInterval = PLAYER.timeUpdateEventIntervalSec // รับ timeUpdate ทุกวินาทีเพื่อตรวจความก้าวหน้าของเฟรม
    try {
      instance.bufferOptions = { ...PLAYER.bufferOptions }
    } catch {
      // บางแพลตฟอร์มไม่รองรับ bufferOptions
    }
    instance.play()
  })
}
