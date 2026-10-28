import { sendAppLog } from './queue'

const ERROR_STACK_MAX = 300

/** tag ตามแหล่ง: มี channel = Player ไม่งั้นใช้ tag ที่ส่งมา */
function forChannel(channel, tag) {
  return {
    tag: channel ? 'Player' : tag,
    channelId: channel?.id || null,
    channelName: channel?.name || null,
  }
}

export function logState(state, message, details = {}, channel = null, tag = 'App') {
  sendAppLog({ level: 'info', state, message, details, ...forChannel(channel, tag) })
}

export function logWarn(state, message, details = {}, channel = null, tag = 'App') {
  sendAppLog({ level: 'warn', state, message, details, ...forChannel(channel, tag) })
}

export function logError(state, message, error = null, details = {}, channel = null, tag = 'App') {
  sendAppLog({
    level: 'error',
    state,
    message,
    details: {
      ...details,
      errorMessage: error?.message || (typeof error === 'string' ? error : 'Unknown error'),
      errorName: error?.name,
      errorCode: error?.code,
      nativeError: error?.nativeException || error?.nativeError || null,
      errorStack: error?.stack?.slice?.(0, ERROR_STACK_MAX) || null,
    },
    ...forChannel(channel, tag),
  })
}

export function logChannelState(state, message, details = {}) {
  sendAppLog({ level: 'info', tag: 'Channels', state, message, details })
}

export { sendAppLog }
