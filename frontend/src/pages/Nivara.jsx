import { Link } from 'react-router-dom'
import { LanguageToggle, useI18n } from '../i18n.jsx'

// `key` points to a translation in strings.js.
// Tools without a `key` (Check a leaked copy) simply stay in English.
const tools = [
  {
    icon: '🔐',
    key: 'tool.vault',
    title: 'Evidence Vault',
    description: 'Keep important photos, files and notes protected.',
    to: '/nivara/vault',
    tag: 'PRIVATE STORAGE',
    color: '#EDE7FF',
  },
  {
    icon: '🪄',
    key: 'tool.prove',
    title: "Prove It's Fake",
    description: 'Examine suspicious or manipulated content.',
    to: '/nivara/prove',
    tag: 'CONTENT CHECK',
    color: '#FCE7F3',
  },
  {
    icon: '🆘',
    key: 'tool.alert',
    title: 'Ask for Help',
    description: 'Reach out to someone you trust when you need support.',
    to: '/nivara/alert',
    tag: 'QUICK SUPPORT',
    color: '#FFE8DC',
  },
  {
    icon: '📄',
    key: 'tool.report',
    title: 'Report & takedown',
    description: 'Build a police-ready report and a takedown complaint.',
    to: '/nivara/report',
    tag: 'TAKE ACTION',
    color: '#DDF5ED',
  },
  {
    icon: '🤝',
    key: 'tool.help',
    title: 'Get Help',
    description: 'Find support resources and helplines.',
    to: '/nivara/help',
    tag: 'SUPPORT',
    color: '#FFF0C9',
  },
  {
    icon: '📨',
    title: 'Safe Share',
    description: 'Send a photo with an invisible mark for each person, so a leak can be traced.',
    to: '/nivara/safeshare',
    tag: 'SHARE SAFELY',
    color: '#E6ECFF',
  },
  {
    icon: '🔎',
    key: 'tool.scan',
    title: 'Check a leaked copy',
    description: 'Find out where a copy of your image may have spread.',
    to: '/nivara/safeshare-scan',
    tag: 'STAY INFORMED',
    color: '#DDF4F7',
  },
  {
    icon: '⚙️',
    key: 'tool.settings',
    title: 'Settings',
    description: 'Manage your secret PIN, decoy PIN and preferences.',
    to: '/nivara/settings',
    tag: 'YOUR PREFERENCES',
    color: '#F0E6E2',
  },
]

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F8F6FC',
    color: '#28213F',
    fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
    padding: '0 22px 110px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: '1120px',
    margin: '0 auto',
  },
}

export default function Nivara() {
  const { t } = useI18n()

  return (
    <main style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        .nivara-card {
          display: flex;
          flex-direction: column;
          min-height: 205px;
          padding: 23px;
          background: white;
          border: 1px solid #ECE7F4;
          border-radius: 20px;
          color: #28213F;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(47, 31, 78, .035);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .nivara-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(47, 31, 78, .09);
          border-color: #C8B8F0;
        }
        .nivara-card:focus-visible {
          outline: 3px solid #9A7BE8;
          outline-offset: 4px;
        }
        .nivara-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }
        @media (max-width: 800px) {
          .nivara-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 500px) {
          .nivara-grid { grid-template-columns: 1fr; }
          .nivara-hero { padding: 27px 22px !important; }
          .nivara-topbar { padding-top: 20px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nivara-card { transition: none; }
        }
      `}</style>

      <div style={styles.container}>
        {/* Top navigation */}
        <header
          className="nivara-topbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            padding: '25px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              background: '#30234C',
              display: 'grid',
              placeItems: 'center',
              color: 'white',
              fontSize: 23,
            }}>
              ✳
            </div>
            <div>
              <div style={{
                fontSize: 21,
                fontWeight: 800,
                letterSpacing: '-.7px',
              }}>
                nivara<span style={{ color: '#9070D8' }}>.</span>
              </div>
              <div style={{ color: '#827A94', fontSize: 11 }}>
                {t('home.private')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Language switch: EN / हिं / ಕ */}
            <LanguageToggle />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 12px',
              border: '1px solid #E7E0F0',
              borderRadius: 30,
              background: 'white',
              fontSize: 12,
              color: '#514366',
              fontWeight: 600,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#36A67A',
              }} />
              {t('home.session')}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          className="nivara-hero"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '38px 38px',
            borderRadius: 26,
            background: 'linear-gradient(120deg, #30234C 0%, #483366 62%, #70529A 100%)',
            color: 'white',
            marginBottom: 30,
          }}
        >
          <div style={{
            position: 'absolute',
            width: 220,
            height: 220,
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: '50%',
            right: -45,
            top: -95,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: 150,
            height: 150,
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: '50%',
            right: 20,
            top: -55,
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            maxWidth: 620,
          }}>
            <div style={{
              display: 'inline-block',
              padding: '7px 11px',
              borderRadius: 30,
              background: 'rgba(255,255,255,.12)',
              fontSize: 11,
              letterSpacing: 1.1,
              fontWeight: 700,
              marginBottom: 18,
            }}>
              ✦ {t('home.eyebrow')}
            </div>

            <h1 style={{
              fontSize: 'clamp(29px, 5vw, 43px)',
              letterSpacing: '-1.5px',
              lineHeight: 1.13,
              margin: '0 0 14px',
              fontWeight: 750,
            }}>
              {t('home.heading')}<br />
              <span style={{ color: '#D9C7FF' }}>{t('home.safe')}</span>
            </h1>

            {/* The no-blame line, translated */}
            <p style={{
              color: '#E2D9EF',
              lineHeight: 1.8,
              fontSize: 15,
              maxWidth: 430,
              margin: '0 0 24px',
            }}>
              {t('home.tagline')}
            </p>

            <a
              href="#your-tools"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                minHeight: 44,
                background: '#F0E9FF',
                color: '#30234C',
                borderRadius: 11,
                padding: '12px 17px',
                fontWeight: 750,
                textDecoration: 'none',
                fontSize: 13,
              }}
            >
              {t('home.explore')} <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* Section heading */}
        <section id="your-tools">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: 12,
            marginBottom: 19,
          }}>
            <div>
              <div style={{
                color: '#7554B4',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.5,
                marginBottom: 7,
              }}>
                {t('home.toolkit')}
              </div>
              <h2 style={{
                fontSize: 24,
                letterSpacing: '-.6px',
                margin: 0,
              }}>
                {t('home.heading2')}
              </h2>
              <p style={{
                color: '#6B6280',
                fontSize: 13,
                lineHeight: 1.6,
                margin: '8px 0 0',
              }}>
                {t('home.choose')}
              </p>
            </div>
            <span style={{
              color: '#6B6280',
              fontSize: 12,
              whiteSpace: 'nowrap',
              paddingBottom: 3,
            }}>
              {tools.length} {t('home.toolCount')}
            </span>
          </div>

          <nav className="nivara-grid" aria-label={t('home.toolkit')}>
            {tools.map((tool, index) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="nivara-card"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 20,
                }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 15,
                      display: 'grid',
                      placeItems: 'center',
                      background: tool.color,
                      fontSize: 23,
                    }}
                  >
                    {tool.icon}
                  </div>
                  <span style={{
                    fontSize: 9,
                    letterSpacing: '.65px',
                    fontWeight: 800,
                    color: '#6F6482',
                    textAlign: 'right',
                  }}>
                    {tool.key ? t(`tag.${tool.key.split('.')[1]}`) : tool.tag}
                  </span>
                </div>

                <h3 style={{
                  fontSize: 17,
                  letterSpacing: '-.3px',
                  margin: '0 0 8px',
                  fontWeight: 750,
                }}>
                  {tool.key ? t(tool.key) : tool.title}
                </h3>

                <p style={{
                  color: '#6B6280',
                  fontSize: 13,
                  lineHeight: 1.7,
                  margin: '0 0 17px',
                  flex: 1,
                }}>
                  {tool.key ? t(`desc.${tool.key.split('.')[1]}`) : tool.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#7554B4',
                  fontSize: 12,
                  fontWeight: 750,
                }}>
                  {t('home.open')} <span aria-hidden="true" style={{ fontSize: 17 }}>↗</span>
                </div>
              </Link>
            ))}
          </nav>
        </section>

        {/* Privacy reminder */}
        <section style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: '19px 21px',
          background: '#EEE9F8',
          border: '1px solid #E5DDF3',
          borderRadius: 17,
          marginTop: 27,
        }}>
          <div aria-hidden="true" style={{ fontSize: 23 }}>💜</div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 14 }}>
              {t('home.reminder')}
            </h3>
            <p style={{
              margin: 0,
              color: '#5F5573',
              fontSize: 12,
              lineHeight: 1.8,
            }}>
              {t('home.reminderText')}
            </p>
          </div>
        </section>

        {/* Footer (Hide button now floats on every Nivara page) */}
        <footer style={{
          marginTop: 28,
          paddingTop: 22,
          borderTop: '1px solid #E8E2F0',
        }}>
          <div style={{ color: '#6F6482', fontSize: 11, lineHeight: 1.7, maxWidth: 420 }}>
            <strong style={{ color: '#57496C' }}>Nivara</strong>
            <br />
            {t('home.hideHint')}
          </div>
        </footer>
      </div>
    </main>
  )
}