// Member 2 – Clues card: shown when no original is found. Clues, not proof.
import { useNavigate } from 'react-router-dom'

const LEVELS = {
  strong: {
    box: 'border-danger',
    text: 'text-danger',
    bar: 'bg-danger',
    filled: 3,
    label: 'Strong',
    heading: 'Strong clue: this image is likely AI-made or AI-edited',
  },
  some: {
    box: 'border-amber-500',
    text: 'text-amber-700',
    bar: 'bg-amber-500',
    filled: 2,
    label: 'Some',
    heading: 'Some clues: this image has been edited or re-saved',
  },
  none: {
    box: 'border-nivara-500',
    text: 'text-nivara-900',
    bar: 'bg-nivara-500',
    filled: 1,
    label: 'None found',
    heading: 'No AI label found. This does NOT mean the photo is real',
  },
}

const ICONS = {
  alert: { sign: '!', cls: 'bg-danger text-white' },
  warn: { sign: '!', cls: 'bg-amber-500 text-white' },
  ok: { sign: '✓', cls: 'bg-safe text-white' },
  clear: { sign: '–', cls: 'bg-gray-200 text-gray-600' },
}

export default function CluesCard({ clues }) {
  const navigate = useNavigate()
  const lv = LEVELS[clues.level] || LEVELS.none
  const checks = clues.checks || []

  return (
    <section className={`mt-4 rounded-card border-2 ${lv.box} bg-white p-4`} aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-wide text-nivara-700">Clues, not proof</p>
      <h2 className={`mt-1 text-lg font-semibold ${lv.text}`}>{lv.heading}</h2>

      {/* Clue strength meter */}
      <div className="mt-3">
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-3 flex-1 rounded-full ${i <= lv.filled ? lv.bar : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Clue strength: <span className={`font-semibold ${lv.text}`}>{lv.label}</span>
        </p>
      </div>

      {/* Checklist */}
      <ul className="mt-4 divide-y divide-gray-100 rounded-card border border-gray-100">
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
                <p className="text-sm font-medium text-nivara-900">{c.name}</p>
                <p className="text-sm text-gray-700">{c.detail}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-sm text-nivara-900">
        For real proof, Nivara needs your original photo. Save your photos in the Nivara vault, then check again.
      </p>
      <button onClick={() => navigate('/nivara/help')} className="mt-3 w-full rounded-card bg-nivara-100 p-3 text-nivara-900">
        Get help
      </button>
    </section>
  )
}