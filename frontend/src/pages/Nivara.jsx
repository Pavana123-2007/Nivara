
import { useEffect, useState } from 'react'
import { health } from '../api.js'

const TOOLS = [
  'Evidence vault',
  "Prove it's fake",
  'Send alert',
  'Report & takedown',
  'Get help',
]

export default function Nivara() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    health()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('backend not reachable'))
  }, [])

  return (
    <main className="min-h-screen bg-nivara-50 p-4 font-sans">
      <h1 className="text-2xl font-semibold text-nivara-900">
        Nivara
      </h1>

      <p className="mt-2 text-sm text-nivara-700">
        Server: {status}
      </p>

      <div className="mt-6 grid gap-3">
        {TOOLS.map((t) => (
          <div
            key={t}
            className="rounded-card bg-white p-4 text-nivara-900 shadow-sm"
          >
            {t}
          </div>
        ))}
      </div>
    </main>
  )
}
