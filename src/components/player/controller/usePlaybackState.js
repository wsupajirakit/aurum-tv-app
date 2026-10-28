import { useRef, useState } from 'react'

/**
 * state ที่ UI เห็น (loading/error) + ค่าภายในที่เปลี่ยนบ่อยแต่ไม่ต้อง render ใหม่ (refs)
 * รวม refs เป็นก้อนเดียว ส่งต่อให้ hook ย่อยใช้ร่วมกัน
 */
export function usePlaybackState({ channel, isMain, url, loadEpoch }) {
  const [loading, setLoading] = useState(!isMain)
  const [error, setError] = useState(null)

  const refs = useRef(null)
  if (refs.current === null) {
    refs.current = {
      prevChannelId: channel?.id,
      prevEpoch: loadEpoch,
      currentUrl: url,
      currentEpoch: loadEpoch,
      autoRetryCount: 0,
      loadStartTime: Date.now(),
      isReconnecting: false,
      hasStartedPlaying: false,
      currentPlayingChannelId: null,
      lastProgressTime: Date.now(),
      lastPlaybackPosition: -1,
      /** URL ที่ player กำลังเล่นจริง (อาจเป็นแหล่งสำรอง ไม่ใช่ channel.url) */
      playingUrl: url,
      /** URL ที่ลองแล้วพังในการโหลดครั้งนี้ — ใช้เลือกแหล่งถัดไป */
      triedUrls: new Set(),
      /** แจ้ง backend ไปแล้วในการโหลดครั้งนี้ (แจ้งครั้งเดียวพอ เซิร์ฟเวอร์ตรวจเอง) */
      reportedThisLoad: false,
    }
  }
  const r = refs.current

  // กันจอดำตอนสลับช่อง: ช่อง/epoch เปลี่ยนเมื่อไร เปิดจอโหลดทันทีใน render นี้เลย (ไม่รอ effect)
  if (!isMain && (r.prevChannelId !== channel?.id || r.prevEpoch !== loadEpoch)) {
    r.prevChannelId = channel?.id
    r.prevEpoch = loadEpoch
    if (!loading) setLoading(true)
  }

  return { loading, setLoading, error, setError, refs: r }
}
