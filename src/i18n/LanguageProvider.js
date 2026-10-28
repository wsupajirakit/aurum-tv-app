import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../config'
import { prefs } from '../services/storage'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translate } from './translate'

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
})

/** เก็บภาษาที่เลือกไว้ในเครื่อง — เปิดแอปครั้งถัดไปได้ภาษาเดิม (ค่าเริ่มต้น ENG) */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE)

  useEffect(() => {
    let active = true
    prefs.get(STORAGE_KEYS.language).then((saved) => {
      if (active && SUPPORTED_LANGUAGES.includes(saved)) setLanguageState(saved)
    })
    return () => {
      active = false
    }
  }, [])

  const setLanguage = useCallback((next) => {
    if (!SUPPORTED_LANGUAGES.includes(next)) return
    setLanguageState(next)
    prefs.set(STORAGE_KEYS.language, next)
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage, t: (key, params) => translate(language, key, params) }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/** { language, setLanguage, t } */
export function useI18n() {
  return useContext(LanguageContext)
}
