/**
 * สีทั้งแอป — ตั้งชื่อตามหน้าที่ (ไม่ใช่ตามเฉดสี) คอมโพเนนต์ห้ามใส่ค่าสีเอง
 */

/** ขาว/ดำโปร่งแสงตามระดับ alpha */
const white = (alpha) => `rgba(255, 255, 255, ${alpha})`
const black = (alpha) => `rgba(0, 0, 0, ${alpha})`

export const colors = {
  // ---- พื้นฐาน ----
  bg: '#07090F',
  black: '#000000',
  white: '#FFFFFF',
  panel: 'rgba(11, 14, 22, 0.94)',
  panelSolid: '#0B0E16',

  // ---- ตัวอักษร ----
  text: '#F2F5FC',
  textStrong: '#FFFFFF',
  textBright: white(0.9),
  textSoft: white(0.85),
  textMuted: white(0.75),
  textDim: '#98A2B8',
  textSubtle: white(0.6),
  textFaint: '#5C6577',
  textQuiet: white(0.45),
  textGhost: white(0.35),
  textIcon: '#A0AEC0',
  textGroupFocused: '#BAE6FD',

  // ---- พื้นผิว/เส้นขอบ ----
  card: white(0.04),
  surface: white(0.05),
  surfaceRaised: white(0.06),
  surfaceStrong: white(0.08),
  surfaceShimmer: white(0.07),
  track: white(0.12),
  border: white(0.08),
  borderSubtle: white(0.05),
  borderSoft: white(0.12),
  borderMedium: white(0.2),
  borderStrong: white(0.25),
  borderBright: white(0.35),
  borderBadge: white(0.22),
  surfacePressed: white(0.25),

  // ---- โฟกัสรีโมต/เมาส์ (นีออน มองเห็นจากระยะ 3-4 เมตร) ----
  focusFill: '#2563EB',
  focusRing: '#00FFFF',

  // ---- สีหลัก ----
  accent: '#7C8CFF',
  accentSoft: 'rgba(124, 140, 255, 0.25)',
  accentTint: 'rgba(124, 140, 255, 0.15)',
  accentBorder: 'rgba(124, 140, 255, 0.65)',
  cardFocused: 'rgba(124, 140, 255, 0.16)',
  borderFocused: '#7C8CFF',

  // ---- สถานะ ----
  live: '#FF4D6A',
  liveHot: '#FF2E55',
  liveDot: '#FF3B30',
  danger: '#FF4D6A',
  dangerText: '#FF6B81',
  dangerTint: 'rgba(255, 77, 106, 0.15)',
  dangerBorder: 'rgba(255, 77, 106, 0.3)',

  // ---- จอโหลด ----
  gold: '#F5C518',
  goldSoft: 'rgba(245, 197, 24, 0.35)',
  goldGlow: 'rgba(245, 197, 24, 0.25)',
  goldBorder: 'rgba(245, 197, 24, 0.4)',
  cyan: '#00D2FF',
  cyanGlow: 'rgba(0, 210, 255, 0.25)',
  cyanBorder: 'rgba(0, 210, 255, 0.45)',
  ringInner: white(0.75),
  transparent: 'transparent',

  // ---- หน้าเปิดแอป (ต้องตรงกับสีพื้น native splash ใน app.json) ----
  splashBg: '#030303',
  splashTagline: '#E9C46A',

  // ---- เงา/overlay ----
  shadow: '#000000',
  textShadow: black(0.55),
  textShadowStrong: black(0.7),
  textShadowHeavy: black(0.95),
  scrim: 'rgba(7, 9, 15, 0.94)',
  scrimDeep: ['rgba(2, 4, 8, 0.88)', 'rgba(2, 4, 8, 0.95)'],
  dialog: 'rgba(10, 15, 26, 0.96)',
  sidebarGradient: ['rgba(12, 15, 24, 0.96)', 'rgba(6, 8, 14, 0.92)'],
  badgeGradient: ['rgba(15, 20, 32, 0.97)', 'rgba(9, 12, 20, 0.92)'],
  badgeBg: 'rgba(15, 20, 32, 0.95)',
}
