import AsyncStorage from '@react-native-async-storage/async-storage'

/** ค่าตั้งค่าทั่วไป (ไม่ใช่ความลับ) เช่น ภาษา — พลาดคืน null ไม่ throw */
export const prefs = {
  async get(key) {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      /* ที่เก็บเต็ม/ใช้ไม่ได้ — ใช้ค่าในหน่วยความจำต่อ */
    }
  },
}
