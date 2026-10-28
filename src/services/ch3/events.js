/** แจ้งทุกส่วนของแอป (รายการช่อง, player) เมื่อได้ URL ช่อง 3 ใหม่ */
const listeners = new Set()

export function onCh3UrlUpdated(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function notifyCh3Updated(newUrl, channelId) {
  listeners.forEach((cb) => {
    try {
      cb(newUrl, channelId)
    } catch {
      /* listener พังไม่กระทบตัวอื่น */
    }
  })
}
