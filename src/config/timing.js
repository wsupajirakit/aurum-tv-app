/** ค่าเวลา (มิลลิวินาที/วินาที) ทั้งแอป — แก้ที่เดียว ห้ามใส่เลขลอยในคอมโพเนนต์ */

const SECOND = 1000
const MINUTE = 60 * SECOND

export const TIMING = {
  /** ถามเซิร์ฟเวอร์ว่ารายการช่องเปลี่ยนไหม */
  channelPollMs: 8 * SECOND,
  /** timeout ของ request ปกติไป backend */
  requestTimeoutMs: 10 * SECOND,
  /** timeout ตอนส่ง log */
  logRequestTimeoutMs: 4 * SECOND,

  /** ป้ายชื่อช่องโชว์ค้างกี่ ms หลังกดเปลี่ยนช่อง */
  badgeVisibleMs: 3 * SECOND,
  /** ซ่อนป้ายหลังภาพเริ่มเล่น */
  badgeHideAfterPlayMs: 1200,

  /** sidebar ย่อเองหลังไม่มีการกด */
  sidebarCollapseAfterExpandMs: 2800,
  sidebarCollapseAfterChannelChangeMs: 3200,
  sidebarCollapseAfterSelectMs: 1800,
  /** throttle ของ onScroll ใน FlatList */
  sidebarScrollThrottleMs: 1500,

  /** นาฬิกา: เดินทุกนาที */
  clockTickMs: MINUTE,
}

export const LOG_QUEUE = {
  /** รวม log info เป็นก้อนก่อนส่ง */
  batchDelayMs: 200,
  /** ส่งไม่ผ่าน → ลองใหม่หลังจากนี้ */
  retryDelayMs: 2 * SECOND,
  batchSize: 50,
  /** เก็บค้างในคิวได้สูงสุด (กันแรมบวมตอนเน็ตหลุดนาน) */
  maxQueued: 100,
}

/** session ของทีวี (access token อายุสั้น + refresh token) */
export const SESSION_TIMING = {
  /** ต่ออายุล่วงหน้าก่อน access token หมดอายุเท่านี้ (วินาที) */
  refreshMarginSec: 60,
  /** ขอ session ไม่สำเร็จ → พักก่อนลองใหม่ ไม่ยิงถี่ทุก request */
  retryAfterFailMs: 30 * SECOND,
  /** รอบตั้งเวลาต่ออายุสั้นที่สุด กัน loop ถี่ตอนนาฬิกาเพี้ยน */
  minKeeperDelayMs: 5 * SECOND,
}

export { SECOND, MINUTE }
