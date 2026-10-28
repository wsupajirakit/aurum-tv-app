import { apiRequest } from './client'

/** เช็คว่ารายการช่องเปลี่ยนหรือยัง — เบามาก เรียกถี่ได้ (ได้ serverTime มาปรับนาฬิกาด้วย) */
export async function fetchUpdatedAt() {
  const data = await apiRequest('/api/health')
  return data?.updatedAt
}
