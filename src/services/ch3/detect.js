import { SOURCE_RESOLVER } from '../../config'
import { hasResolver } from '../sources/channelSources'

/** ช่องนี้ใช้แหล่ง ch3plus ไหม — อ่านจาก channel.sources (ข้อมูลจาก backend) ไม่จำจากชื่อ/id */
export function isCh3(channel) {
  return hasResolver(channel, SOURCE_RESOLVER.CH3PLUS)
}
