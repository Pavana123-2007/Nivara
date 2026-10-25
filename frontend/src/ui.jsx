import { useNavigate } from 'react-router-dom'
import { useI18n } from './i18n.jsx'
import { Icon } from './icons.jsx'

// Shared frame for every Nivara tool page: back link, title, intro, then the page.
// The look (ui-* classes and tokens) lives in index.css.
export function Page({ title, intro, wide = false, children }) {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <main className="ui-page">
      <div className={wide ? 'ui-wrap ui-wide' : 'ui-wrap'}>
        <button type="button" className="ui-back" onClick={() => navigate('/nivara')}>
          <Icon name="chevronLeft" size={18} />
          {t('common.back')}
        </button>
        <h1 className="ui-title">{title}</h1>
        {intro && <p className="ui-intro">{intro}</p>}
        {children}
      </div>
    </main>
  )
}
