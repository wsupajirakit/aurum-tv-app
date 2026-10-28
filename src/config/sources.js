/**
 * แหล่งสตรีมของช่อง — ค่าต้องตรงกับ backend (Resolver* ใน backend internal/channel/model.go)
 * ช่องไหนต้องใช้ resolver อ่านจากข้อมูล sources[].resolver ไม่จำจากชื่อ/id ช่อง
 */
export const SOURCE_RESOLVER = {
  STATIC: 'static',
  /** signed URL จากหน้าเว็บช่อง 3 — แอปดึงเองได้จากเน็ตบ้าน (services/ch3) */
  CH3PLUS: 'ch3plus',
}

export const SOURCE_STATUS = {
  UP: 'up',
  UNKNOWN: 'unknown',
  DOWN: 'down',
}
