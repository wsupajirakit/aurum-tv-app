/**
 * ภาพแบรนด์ของแอป — เปลี่ยนภาพที่นี่ที่เดียว (สองตัวแปรแยกกัน เปลี่ยนอันใดอันหนึ่งได้อิสระ)
 *
 * ┌──────────────────┬───────────────────────────────────────────┬──────────────────────────────┐
 * │ ตัวแปร            │ ใช้ที่ไหน                                    │ ถูกอ่านโดย                     │
 * ├──────────────────┼───────────────────────────────────────────┼──────────────────────────────┤
 * │ homeWallpaper    │ หน้าหลัก (ช่อง "Home" ภาพนิ่ง ตอนเปิดแอป)      │ config/channels.js MAIN_IMAGE │
 * │ splashImage      │ หน้าเปิดแอปเต็มจอ (ก่อนรายการช่องโหลดเสร็จ)     │ config/splash.js SPLASH.image │
 * └──────────────────┴───────────────────────────────────────────┴──────────────────────────────┘
 *
 * ตอนนี้ทั้งสองใช้ภาพเดียวกัน (assets/brand/aurum-tv-wallpaper-4k.jpg, 3840×2160 สร้างด้วย npm run assets:brand)
 * อยากให้ต่างกัน: วางไฟล์ใหม่ใน assets/brand/ แล้วเปลี่ยน require ของตัวแปรนั้นตัวเดียว
 *
 * ⚠️ โลโก้ของ native splash (ก่อน JS โหลด) ไม่ได้อยู่ที่นี่ — อยู่ใน app.json → expo.splash.image
 *    (assets/brand/aurum-tv-logo-mark.png) และต้อง build APK ใหม่ถึงเปลี่ยน
 * ภาพชุดเก่าก่อนรีแบรนด์อยู่ใน branch legacy/brand-assets
 *
 * ชื่อระบบ "Aurum TV" อยู่ 3 ที่: app.json (ชื่อแอป/รหัสแอป) · scripts/render-brand-assets.mjs (BRAND_NAME ในภาพ)
 *   · backend internal/api/server.go (ServiceName)
 */
export const BRAND = {
  /** หน้าหลัก (index / Home still channel) */
  homeWallpaper: require('../../assets/brand/aurum-tv-wallpaper-4k.jpg'),
  /** หน้าเปิดแอปเต็มจอ (in-app splash screen) */
  splashImage: require('../../assets/brand/aurum-tv-wallpaper-4k.jpg'),
}
