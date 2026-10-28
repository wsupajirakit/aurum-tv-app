import { en } from './en'
import { th } from './th'

export const DICTIONARIES = { en, th }
export const SUPPORTED_LANGUAGES = ['en', 'th']
export const DEFAULT_LANGUAGE = 'en'

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

/**
 * แปล key เช่น 'sidebar.channelCount' พร้อมแทนค่า {count}
 * ไม่มีในภาษาที่เลือก → ใช้ภาษาอังกฤษ → ไม่มีอีกคืน key (เห็นชัดว่าลืมแปล)
 */
export function translate(language, key, params) {
  const raw = lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES[DEFAULT_LANGUAGE], key) ?? key
  if (!params || typeof raw !== 'string') return raw
  return raw.replace(/\{(\w+)\}/g, (match, name) => (params[name] === undefined ? match : String(params[name])))
}
