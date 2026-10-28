/** react-native จำลอง: AppState สั่งเปลี่ยนสถานะจากเทสได้ */
const appStateListeners = new Set()

export const AppState = {
  currentState: 'active',
  addEventListener(event, cb) {
    if (event !== 'change') return { remove() {} }
    appStateListeners.add(cb)
    return { remove: () => appStateListeners.delete(cb) }
  },
  /** เทสเรียก: จำลองทีวีพัก/กลับจากสแตนด์บาย */
  __emit(state) {
    AppState.currentState = state
    for (const cb of [...appStateListeners]) cb(state)
  },
  __listenerCount: () => appStateListeners.size,
}

export const Platform = { OS: 'android', Version: 30, isTV: true, select: (o) => o.android ?? o.default }
