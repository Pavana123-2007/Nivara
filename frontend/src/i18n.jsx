import { createContext, useContext, useState } from 'react'
import strings from './strings.js'

const I18n = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('nivara-language') || 'en'
    } catch {
      return 'en'
    }
  })

  const changeLanguage = (nextLang) => {
    setLang(nextLang)
    try {
      localStorage.setItem('nivara-language', nextLang)
    } catch {}
  }

  const t = (key) => strings[lang]?.[key] ?? strings.en[key] ?? key

  return (
    <I18n.Provider value={{ lang, setLang: changeLanguage, t }}>
      {children}
    </I18n.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18n)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n()

  return (
    <div role="group" aria-label="Choose language" style={{
      display: 'flex', gap: 6, flexWrap: 'wrap'
    }}>
      {[
        ['en', 'English'],
        ['hi', 'हिन्दी'],
        ['kn', 'ಕನ್ನಡ']
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          style={{
            minHeight: 40,
            padding: '8px 11px',
            borderRadius: 10,
            border: lang === code ? '2px solid #7554B4' : '1px solid #E7E0F0',
            background: lang === code ? '#EEE9F8' : 'white',
            color: '#30234C',
            cursor: 'pointer',
            fontWeight: 650
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
