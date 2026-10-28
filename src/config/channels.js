import { SECOND } from './timing'
import { BRAND } from './brand'

/**
 * ตัวหา URL แบบ ch3plus (signed URL ของ ByteArk ที่หมดอายุ) — แอปต่ออายุเองจากเน็ตบ้าน แล้ว sync กลับ backend
 * ใช้กับช่องที่ข้อมูลมีแหล่ง resolver = 'ch3plus' (ไม่จำจากชื่อ/id ช่อง) · แหล่งสำรองมาจาก channel.sources
 */
export const CH3 = {
  sourceUrl: 'https://ch3plus.com/live',
  sourceTimeoutMs: 12 * SECOND,
  sourceHeaders: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
  expiresParam: 'x_ark_expires',
  nextDataTag: '<script id="__NEXT_DATA__"',
  scriptClose: '</script>',

  /** ลิงก์ที่ไม่มีวันหมดอายุในตัว ให้ถือว่าใช้ได้อีกเท่านี้ (วินาที) */
  assumedLifetimeSec: 6 * 3600,
  /** ต่ออายุซ้ำไม่ถี่กว่านี้ ถ้า cache ยังสด */
  renewThrottleMs: 15 * SECOND,
  /** cache ต้องเหลืออายุมากกว่านี้ (วินาที) ถึงยอมใช้ซ้ำโดยไม่ต่ออายุ */
  cacheMinRemainingSec: 300,
  /** resolveStreamUrl: cache เหลือมากกว่านี้ใช้ได้เลย */
  cacheFreshSec: 3600,
  /** resolveStreamUrl: URL ของช่องเหลือมากกว่านี้ใช้ได้เลย */
  urlFreshSec: 600,
  /** URL จาก backend refresh ต้องเหลือมากกว่านี้ */
  backendUrlMinSec: 300,
}

/** ช่องภาพนิ่งหน้าหลัก — ชื่อ/กลุ่มแปลตามภาษาตอนแสดงผล (ดู i18n: main.*) */
export const MAIN_CHANNEL_ID = 'main-channel'
/** ภาพหน้าหลัก — เปลี่ยนที่ config/brand.js (homeWallpaper) */
export const MAIN_IMAGE = BRAND.homeWallpaper
