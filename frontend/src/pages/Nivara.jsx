import { Link } from 'react-router-dom'
import { LanguageToggle, useI18n } from '../i18n.jsx'
import { Icon } from '../icons.jsx'

// Every tool's title is t(`tool.${id}`) and its description t(`desc.${id}`), from strings.js.
// Styles: .home-*, .sos, .groups, .list, .row in index.css.
const sections = [
  {
    key: 'section.evidence',
    tools: [
      { id: 'vault', icon: 'lock', to: '/nivara/vault' },
      { id: 'prove', icon: 'scan', to: '/nivara/prove' },
      { id: 'report', icon: 'file', to: '/nivara/report' },
    ],
  },
  {
    key: 'section.spread',
    tools: [
      { id: 'takedown', icon: 'flag', to: '/nivara/takedown' },
      { id: 'safeshare', icon: 'send', to: '/nivara/safeshare' },
      { id: 'scan', icon: 'search', to: '/nivara/safeshare-scan' },
    ],
  },
]

export default function Nivara() {
  const { t } = useI18n()

  return (
    <main className="ui-page">
      <div className="ui-wrap ui-wide">
        <header className="home-top">
          <div className="brand">
            <span className="brand-mark"><Icon name="shield" size={18} /></span>
            <span className="brand-name">Nivara</span>
          </div>
          <div className="home-actions">
            <LanguageToggle />
            <Link to="/nivara/settings" className="icon-btn" aria-label={t('tool.settings')} title={t('tool.settings')}>
              <Icon name="sliders" size={19} />
            </Link>
          </div>
        </header>

        <section className="home-intro">
          <h1>{t('home.heading')} {t('home.safe')}</h1>
          {/* The no-blame line, translated */}
          <p>{t('home.tagline')}</p>
        </section>

        {/* Urgent actions first: alert a trusted person, or call a helpline */}
        <div className="quick">
          <Link to="/nivara/alert" className="sos">
            <span className="sos-icon"><Icon name="bell" size={20} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="sos-title">{t('home.sos')}</span>
              <span className="sos-hint">{t('home.sosHint')}</span>
            </span>
            <Icon name="chevronRight" size={20} className="row-chevron" />
          </Link>
          <Link to="/nivara/help" className="sos sos-calm">
            <span className="sos-icon"><Icon name="phone" size={19} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="sos-title">{t('tool.help')}</span>
              <span className="sos-hint">{t('desc.help')}</span>
            </span>
            <Icon name="chevronRight" size={20} className="row-chevron" />
          </Link>
        </div>

        <div className="groups">
          {sections.map((section) => (
            <section key={section.key} aria-labelledby={section.key}>
              <h2 id={section.key} className="group-title">{t(section.key)}</h2>
              <nav className="list">
                {section.tools.map((tool) => (
                  <Link key={tool.id} to={tool.to} className="row">
                    <span className="row-icon"><Icon name={tool.icon} size={19} /></span>
                    <span className="row-text">
                      <span className="row-title">{t(`tool.${tool.id}`)}</span>
                      <span className="row-desc">{t(`desc.${tool.id}`)}</span>
                    </span>
                    <Icon name="chevronRight" size={18} className="row-chevron" />
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <section className="reassure">
          <Icon name="heart" size={18} />
          <div>
            <strong>{t('home.reminder')}</strong>
            <p>{t('home.reminderText')}</p>
          </div>
        </section>

        {/* The Get help / Hide buttons float on every Nivara page */}
        <footer className="home-foot">{t('home.hideHint')}</footer>
      </div>
    </main>
  )
}
