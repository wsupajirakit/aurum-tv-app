import { useEffect } from 'react'
import { startSessionKeeper } from './src/api'
import { LanguageProvider } from './src/i18n'
import { TvScreen } from './src/screens/TvScreen'

/** จุดเริ่มแอป: ภาษา (ค่าเริ่มต้น ENG) + session ของทีวี (HMAC/refresh token) → หน้าจอหลัก */
export default function App() {
  useEffect(() => startSessionKeeper(), [])

  return (
    <LanguageProvider>
      <TvScreen />
    </LanguageProvider>
  )
}
