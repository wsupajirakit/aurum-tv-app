import * as SecureStore from 'expo-secure-store'
import { prefs } from './prefs'

/**
 * ที่เก็บ token — ใช้ Android Keystore / iOS Keychain ผ่าน expo-secure-store
 * แพลตฟอร์มที่ไม่มี (เช่น web) ถอยไปใช้ AsyncStorage แทน แอปยังทำงานได้
 */
let availability = null

async function isSecureAvailable() {
  if (availability === null) {
    availability = await SecureStore.isAvailableAsync().catch(() => false)
  }
  return availability
}

export const secure = {
  async get(key) {
    try {
      if (await isSecureAvailable()) return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
    return prefs.get(key)
  },
  async set(key, value) {
    try {
      if (await isSecureAvailable()) return await SecureStore.setItemAsync(key, value)
    } catch {
      return undefined
    }
    return prefs.set(key, value)
  },
  async remove(key) {
    try {
      if (await isSecureAvailable()) return await SecureStore.deleteItemAsync(key)
    } catch {
      return undefined
    }
    return prefs.set(key, '')
  },
}
