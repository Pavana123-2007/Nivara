// Member 2 – Clues card: shown when no original is found. Clues, not proof.
// The check names and details come from the server in English.
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n.jsx'

const LEVELS = {
  strong: { color: 'var(--danger)', filled: 3, label: 'clues.lvStrong', heading: 'clues.strong' },
  some: { color: '#b45309', filled: 2, label: 'clues.lvSome', heading: 'clues.some' },
  none: { color: 'var(--accent)', filled: 1, label: 'clues.lvNone', heading: 'clues.none' },
}

const ICONS = {
  alert: { sign: '!', cls: 'bg-danger text-white' },
  warn: { sign: '!', cls: 'bg-amber-500 text-white' },
  ok: { sign: '✓', cls: 'bg-safe text-white' },
  clear: { sign: '–', cls: 'bg-gray-200 text-gray-600' },
}

export default function CluesCard({ clues }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const lv = LEVELS[clues.level] || LEVELS.none
  const checks = clues.checks || []

  return (
    <section className="ui-card" style={{ boxShadow: `var(--shadow), inset 0 0 0 1.5px ${lv.color}` }} aria-live="polite">
      <p className="ui-small" style={{ fontWeight: 600, color: 'var(--ink-3)' }}>{t('clues.eyebrow')}</p>
      <h2 className="ui-h2" style={{ color: lv.color, marginTop: 4 }}>{t(lv.heading)}</h2>

      {/* Clue strength meter */}
      <div style={{ marginTop: 12 }}>
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 flex-1 rounded-full" style={{ background: i <= lv.filled ? lv.color : 'var(--line)' }} />
          ))}
        </div>
        <p className="ui-small" style={{ marginTop: 4 }}>
          {t('clues.strength')} <strong style={{ color: lv.color }}>{t(lv.label)}</strong>
        </p>
      </div>

      {/* Checklist */}
      <ul className="mt-4 divide-y divide-gray-100 rounded-card border border-gray-100" style={{ padding: 0, listStyle: 'none' }}>
        {checks.map((c) => {
          const icon = ICONS[c.status] || ICONS.clear
          return (
            <li key={c.name} className="flex items-start gap-3 p-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${icon.cls}`}
                aria-hidden="true"
              >
                {icon.sign}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ margin: 0 }}>{c.name}</p>
                <p className="ui-muted">{c.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="ui-muted" style={{ marginTop: 14 }}>{t('clues.needOriginal')}</p>
      <button onClick={() => navigate('/nivara/help')} className="ui-btn ui-btn-soft" style={{ marginTop: 12 }}>
        {t('tool.help')}
      </button>
    </section>
  )
}
