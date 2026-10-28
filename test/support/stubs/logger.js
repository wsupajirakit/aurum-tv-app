/** logger จำลอง: จดชื่อ state ของ log ทุกตัว (log คือพฤติกรรมที่ต้องคงเดิมด้วย — ใช้ไล่ปัญหาบนทีวีจริง) */
import { trace } from '../trace.js'

export const logState = (state) => trace.push('log.info', state)
export const logWarn = (state) => trace.push('log.warn', state)
export const logError = (state) => trace.push('log.error', state)
export const logChannelState = (state) => trace.push('log.channels', state)
export const sendAppLog = () => {}
