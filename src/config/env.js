/**
 * ค่าจาก env ตอน build — Expo ฝังเฉพาะตัวแปรที่ขึ้นต้นด้วย EXPO_PUBLIC_
 * ต้องอ้างแบบ process.env.EXPO_PUBLIC_X ตรงๆ ทีละตัว (Expo แทนค่าแบบ static ตอน bundle)
 *
 * ⚠️ ทุกค่าที่นี่ถูกฝังใน APK แกะออกได้ — ห้ามใส่ API_KEY ของแอดมิน
 *    HMAC secret ใช้ยืนยันว่า request มาจากแอปเรา ไม่ใช่ความลับระดับผู้ใช้
 */

const DEFAULT_API_URL = 'http://10.0.2.2:3000' // Android TV emulator → เครื่อง dev

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

/** ส่วน path ของ API_URL (ถ้า backend อยู่ใต้ path ย่อย) — ใช้ประกอบ path ที่นำไปเซ็น HMAC */
export const API_PATH_PREFIX = API_URL.replace(/^https?:\/\/[^/]+/i, '')

export const HMAC_KEY_ID = process.env.EXPO_PUBLIC_HMAC_KEY_ID || ''
export const HMAC_SECRET = process.env.EXPO_PUBLIC_HMAC_SECRET || ''

/** ยังไม่ได้ตั้งคีย์ = ไม่เซ็น (backend โหมด log ยังรับ) */
export const HMAC_ENABLED = Boolean(HMAC_KEY_ID && HMAC_SECRET)
