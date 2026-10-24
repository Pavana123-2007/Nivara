import { useNavigate } from 'react-router-dom'
import { HELPLINES, LINKS } from './helplines.js'

const Unverified = ({ item }) =>
  import.meta.env.DEV && !item.verified ? (
    <span className="ml-2 rounded bg-yellow-200 px-1 text-xs text-yellow-900">not verified yet</span>
  ) : null

export default function HelpFinder() {
  const navigate = useNavigate()
  return (
    <main className="min-h-screen bg-nivara-50 p-4 font-sans">
      <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">← Back</button>
      <h1 className="mt-2 text-2xl font-semibold text-nivara-900">Get help</h1>
      <p className="mt-1 text-sm text-nivara-700">You don't have to face this alone. Tap a number to call.</p>

      <div className="mt-4 grid gap-3">
        {HELPLINES.map((h) => (
          <a key={h.number} href={`tel:${h.number}`} className="flex items-center justify-between rounded-card bg-white p-4 shadow-sm">
            <span>
              <span className="block font-medium text-nivara-900">{h.name}<Unverified item={h} /></span>
              <span className="block text-sm text-nivara-700">{h.note}</span>
            </span>
            <span className="text-2xl font-semibold text-nivara-600">{h.number}</span>
          </a>
        ))}
        {LINKS.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-card bg-white p-4 text-nivara-900 shadow-sm">
            {l.name} ↗<Unverified item={l} />
          </a>
        ))}
      </div>
    </main>
  )
}