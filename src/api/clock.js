/**
 * นาฬิกาเทียบเซิร์ฟเวอร์ — ทีวีหลายเครื่องตั้งเวลาเพี้ยน (ไม่มี NTP) ลายเซ็นจะโดนปฏิเสธเพราะ timestamp
 * ทุก response ของ backend มี header x-tv-server-time → จำส่วนต่างไว้ แล้วใช้เวลาที่ชดเชยแล้วตอนเซ็น
 */
export const SERVER_TIME_HEADER = 'x-tv-server-time'

let offsetSec = 0

const localNowSec = () => Math.floor(Date.now() / 1000)

export function serverNowSec() {
  return localNowSec() + offsetSec
}

export function syncServerTime(serverSec) {
  const value = Number(serverSec)
  if (Number.isFinite(value) && value > 0) offsetSec = value - localNowSec()
}
