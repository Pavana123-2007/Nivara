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

  // t('alert.sent', { name: 'Asha' }) fills {name} in the translated text
  const t = (key, vars) => {
    let text = strings[lang]?.[key] ?? strings.en[key] ?? key
    for (const [name, value] of Object.entries(vars || {})) text = text.replaceAll(`{${name}}`, value)
    return text
  }

  // for dates: new Date(...).toLocaleString(locale)
  const locale = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }[lang] || 'en-IN'

  return (
    <I18n.Provider value={{ lang, setLang: changeLanguage, t, locale }}>
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
    // Segmented control; styles in index.css (.seg)
    <div role="group" aria-label="Language" className="seg">
      {[
        ['en', 'EN', 'English'],
        ['hi', 'हिन्दी', 'हिन्दी'],
        ['kn', 'ಕನ್ನಡ', 'ಕನ್ನಡ'],
      ].map(([code, label, name]) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={name}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
