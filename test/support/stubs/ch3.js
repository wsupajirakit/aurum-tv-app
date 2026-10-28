/**
 * services/ch3 จำลอง — ตรวจช่อง/อายุ URL ใช้ของจริง · การต่ออายุ (network) เป็นตัวปลอมที่สั่งผลได้
 */
import { trace } from '../trace.js'

export { isCh3 } from '../../../src/services/ch3/detect.js'
export { isUrlExpiring, readExpiresAt } from '../../../src/services/ch3/expiry.js'

const defaults = {
  resolve: async (channel) => channel?.url ?? null,
  renew: async ({ currentUrl }) => currentUrl,
}
let behaviour = { ...defaults }

export const ch3Control = {
  reset() {
    behaviour = { ...defaults }
  },
  onResolve(fn) {
    behaviour.resolve = fn
  },
  onRenew(fn) {
    behaviour.renew = fn
  },
}

export async function resolveStreamUrl(channel, options = {}) {
  trace.push('ch3.resolve', channel?.id ?? null, Boolean(options.forceRefresh))
  return behaviour.resolve(channel, options)
}

export async function renewCh3Auto(options = {}) {
  trace.push('ch3.renew', options.trigger ?? null, Boolean(options.force))
  return behaviour.renew(options)
}

export const triggerCh3AutoRenew = () => {}
export const getCh3CachedUrl = () => null
export const onCh3UrlUpdated = () => () => {}
