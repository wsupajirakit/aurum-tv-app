import { SECOND, MINUTE } from './timing'

/** พฤติกรรมตัวเล่นวิดีโอ — การกู้สตรีม, watchdog และ timeout */
export const PLAYER = {
  maxAutoRetries: 5,
  /** หน่วงก่อน retry แต่ละครั้ง เพิ่มขึ้นทีละขั้น */
  retryDelaysMs: [2 * SECOND, 4 * SECOND, 6 * SECOND, 8 * SECOND, 10 * SECOND],
  fallbackRetryDelayMs: 5 * SECOND,
  /** ไม่มีเฟรมขยับต่อเนื่องเกินนี้ ถึงนับเป็นสตรีมค้างจริง */
  stallTimeoutMs: 15 * SECOND,
  /** เล่นต่อเนื่องนานเท่านี้ ถึงยอม reset ตัวนับ retry (กัน infinite loop) */
  stablePlaybackMs: MINUTE,
  /** readyToPlay แล้วแต่ภาพยังไม่ขยับ → ปลดจอโหลดหลังจากนี้ กันค้าง */
  safetyDismissMs: 4500,
  /** จอโหลดโชว์อย่างน้อยเท่านี้ ไม่กระพริบหายก่อนตาเห็น */
  minLoadingVisibleMs: 900,
  heartbeatLogMs: MINUTE,

  /** เปิดช่องแล้วภาพไม่มาใน 15 วิ → หยุด retry แล้วถามผู้ใช้ (กด OK หรือเลือกช่องอื่น) */
  loadTimeoutMs: 15 * SECOND,

  /** ตอน reconnect ถ้าลิงก์เหลืออายุน้อยกว่านี้ (วินาที) ให้ขอลิงก์ใหม่ */
  reconnectRefreshBelowSec: 300,
  /** รอบตรวจอายุ token ช่อง 3 ระหว่างดูยาวๆ */
  ch3ProactiveCheckMs: 5 * MINUTE,
  ch3ProactiveRenewBelowSec: 30 * 60,

  /** reconnect ครั้งที่เท่าไรขึ้นไป เริ่มสลับไปแหล่งสำรองของช่อง (ถ้ามี) */
  switchSourceFromAttempt: 1,
  /** ลอง reconnect ครั้งที่เท่าไรขึ้นไปถึงบังคับขอลิงก์ใหม่ / ถาม backend */
  forceResolveFromAttempt: 1,
  backendRefreshFromAttempt: 2,

  bufferOptions: {
    preferredForwardBufferDuration: 8, // ไม่ buffer เกิน live window (~30 วิ)
    minBufferForPlayback: 1.5,
    prioritizeTimeOverSizeThreshold: true,
  },
  timeUpdateEventIntervalSec: 1,
}
