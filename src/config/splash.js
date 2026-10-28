import { SECOND } from './timing'
import { BRAND } from './brand'

/**
 * หน้าเปิดแอป (in-app splash) — ใช้ภาพแบรนด์ 4K เดียวกับหน้าหลัก (config/brand.js)
 * Android 12+ native splash แสดงได้แค่โลโก้กลางจอ → ต่อด้วยภาพเต็มจอนี้ทันทีที่ JS พร้อม (สีพื้นตรงกัน ไม่กระพริบ)
 */
export const SPLASH = {
  /** ภาพหน้าเปิดแอป — เปลี่ยนที่ config/brand.js (splashImage) */
  image: BRAND.splashImage,
  /** โชว์อย่างน้อยเท่านี้ แม้รายการช่องมาเร็ว (ไม่วาบหาย) */
  minVisibleMs: 1500,
  /** เน็ตช้า/เซิร์ฟเวอร์ล่ม → ปิดเองไม่เกินเท่านี้ ให้ผู้ใช้เห็นสถานะในแถบช่อง */
  maxVisibleMs: 6 * SECOND,
  fadeOutMs: 600,
  /** ตำแหน่ง tagline ใต้เส้นทองในภาพ (สัดส่วนความสูงจอ) */
  taglineTop: '81%',
}
