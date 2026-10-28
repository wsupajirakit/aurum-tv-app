import { CH3 } from '../../config'

/** แกะ URL สตรีมจาก __NEXT_DATA__ ของหน้า live (string parsing ไม่ใช้ regex กับ HTML ก้อนใหญ่) */
function extractStreamUrl(html) {
  const idx = html.indexOf(CH3.nextDataTag)
  if (idx === -1) return null
  const start = html.indexOf('>', idx) + 1
  const end = html.indexOf(CH3.scriptClose, start)
  if (end === -1) return null

  const json = JSON.parse(html.slice(start, end))
  const live = json?.props?.initialState?.liveReducer?.live
  // เลือก 1080p (WebSVOD) ก่อน แล้วค่อย fallback ไป 720p
  const streamUrl = live?.streamUrlWebSVOD || live?.streamUrlApp || live?.streamUrl
  return typeof streamUrl === 'string' && streamUrl.includes('m3u8') ? streamUrl : null
}

/** ดึงลิงก์สดล่าสุดของช่อง 3 จากเว็บต้นทางตรงๆ (ใช้ IP บ้านของทีวี) — พลาดคืน null */
export async function fetchFreshCh3StreamDirect() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CH3.sourceTimeoutMs)
  try {
    const res = await fetch(CH3.sourceUrl, { signal: controller.signal, headers: CH3.sourceHeaders })
    if (!res.ok) return null
    return extractStreamUrl(await res.text())
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
