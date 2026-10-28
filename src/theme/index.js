import { colors } from './colors'

/** โทนสีและระยะห่างทั้งแอป — แก้ที่เดียวเปลี่ยนทั้งหมด */
export const theme = {
  color: colors,
  // ทีวีนั่งดูไกล ตัวอักษรและระยะห่างต้องใหญ่กว่ามือถือ
  size: {
    sidebarWidth: 380,
    rowHeight: 84,
    logo: 56,
    radius: 16,
    gutter: 24,
  },
  font: {
    title: 30,
    row: 21,
    label: 15,
    tiny: 12,
  },
}

export { colors }
export { AVATAR_PALETTE, MAIN_AVATAR_COLORS } from './palette'
