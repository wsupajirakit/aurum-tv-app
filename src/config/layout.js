/** ขนาด/ตำแหน่งที่หลายคอมโพเนนต์ต้องใช้ตรงกัน — แยกไว้ที่เดียวกันเพี้ยน */
export const LAYOUT = {
  sidebar: {
    expandedWidth: 235,
    collapsedWidth: 74,
    /** ความสูงแถวช่อง + margin — FlatList ใช้คำนวณตำแหน่ง scroll */
    itemStride: 70,
    rowAvatar: 52,
    skeletonRows: 5,
  },
  /** วิดีโอเว้นซ้ายเท่าความกว้าง rail ตอนย่อ ไม่ให้ sidebar ทับภาพ */
  playerInsetLeft: 70,
  loadingAvatar: 120,
  badgeAvatar: 64,
}
