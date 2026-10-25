import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'
import { HELPLINES, LINKS } from './helplines.js'

const LINK_KEYS = { 'https://cybercrime.gov.in/': 'help.cybercrime', 'https://stopncii.org/': 'help.stopncii' }

function Unverified({ item }) {
  const { t } = useI18n()
  return import.meta.env.DEV && !item.verified ? (
    <span className="ml-2 rounded bg-yellow-200 px-1 text-xs text-yellow-900">{t('help.unverified')}</span>
  ) : null
}

// Same grouped-list look as the home screen (.list / .row in index.css)
export default function HelpFinder() {
  const { t } = useI18n()
  return (
    <Page title={t('tool.help')} intro={t('help.intro')}>
      <nav className="list">
        {HELPLINES.map((h) => {
          const urgent = h.number === '112'
          return (
            <a key={h.number} href={`tel:${h.number}`} className="row">
              <span
                className="row-icon"
                style={urgent ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : undefined}
              >
                <Icon name="phone" size={18} />
              </span>
              <span className="row-text">
                <span className="row-title">
                  {t(`help.${h.number}`)}
                  <Unverified item={h} />
                </span>
                <span className="row-desc">{t(`help.${h.number}note`)}</span>
              </span>
              <span style={{ fontSize: 18, fontWeight: 650, fontVariantNumeric: 'tabular-nums', color: urgent ? 'var(--danger-ink)' : 'var(--ink)' }}>
                {h.number}
              </span>
            </a>
          )
        })}
      </nav>

      <h2 className="group-title" style={{ marginTop: 24 }}>{t('help.online')}</h2>
      <nav className="list">
        {LINKS.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="row" style={{ minHeight: 60 }}>
            <span className="row-text">
              <span className="row-title">
                {LINK_KEYS[l.url] ? t(LINK_KEYS[l.url]) : l.name}
                <Unverified item={l} />
              </span>
            </span>
            <Icon name="external" size={17} className="row-chevron" />
          </a>
        ))}
      </nav>
    </Page>
  )
}
