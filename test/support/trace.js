/**
 * บันทึกทุกพฤติกรรมที่มองเห็นได้จากภายนอกของ player ลงไทม์ไลน์ (เวลาจำลอง)
 * ใช้เทียบก่อน/หลัง refactor ว่าพฤติกรรมเหมือนเดิมทุกจังหวะ
 */
let startedAt = 0
let entries = []

export const trace = {
  reset() {
    startedAt = Date.now()
    entries = []
  },
  push(kind, ...data) {
    entries.push([Date.now() - startedAt, kind, ...data])
  },
  entries: () => entries,
  ofKind: (kind) => entries.filter((e) => e[1] === kind),
}
