import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { safeShareScan } from '../../api.js'

const mods = import.meta.glob('../cover/safeshare.js')

async function nameFor(id) {
  const loader = mods['../cover/safeshare.js']
  if (!loader) return null
  const mod = await loader()
  return mod.getRecipientName(id)
}

export default function SafeShareScan() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { kind: 'found' | 'none' | 'error', text }

  async function scan() {
    setBusy(true)
    setResult(null)
    try {
      const r = await safeShareScan(file)
      if (!r.found) {
        setResult({
          kind: 'none',
          text: 'No Safe Share mark found. Either this photo was never sent through Safe Share, or it was heavily compressed or edited after sharing.',
        })
      } else {
        const name = await nameFor(r.recipient_id)
        const who = name ? `the copy you sent to ${name}` : `copy ${r.recipient_id}`
        const sure = r.confidence === 'high' ? '' : ' (low confidence: treat it as a lead, not proof)'
        setResult({ kind: 'found', text: `This photo came from ${who}${sure}.` })
      }
    } catch (e) {
      setResult({ kind: 'error', text: e.message || 'Something went wrong. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const box =
    result?.kind === 'found'
      ? 'border-2 border-danger'
      : result?.kind === 'error'
        ? 'border-2 border-danger/40'
        : 'border border-gray-100'

  return (
    <main className="min-h-screen bg-nivara-50 px-4 py-6 pb-28 font-sans lg:px-10">
      <div className="mx-auto max-w-md lg:max-w-2xl">
        <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">
          ← Back
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-nivara-900 lg:text-3xl">Who leaked this photo?</h1>
        <p className="mt-1 text-sm text-nivara-700">
          Choose the leaked photo. Nivara checks for the hidden mark in the copies you sent with Safe Share.
        </p>

        <div className="mt-6 rounded-card bg-white p-4 shadow-sm">
          <label className="block cursor-pointer rounded-card border-2 border-dashed border-nivara-500 p-4 text-center text-sm text-nivara-700">
            {file ? file.name : 'Choose the leaked photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setResult(null)
              }}
            />
          </label>
          <button
            onClick={scan}
            disabled={!file || busy}
            className="mt-3 w-full rounded-card bg-nivara-600 p-4 font-medium text-white disabled:opacity-40"
          >
            {busy ? 'Checking...' : 'Check for the mark'}
          </button>
        </div>

        {result && (
          <section className={`mt-4 rounded-card bg-white p-4 ${box}`} aria-live="polite">
            {result.kind === 'found' && <p className="text-lg font-semibold text-danger">Mark found</p>}
            {result.kind === 'none' && <p className="text-lg font-semibold text-nivara-900">No mark found</p>}
            <p className={`mt-1 text-sm ${result.kind === 'error' ? 'text-danger' : 'text-gray-700'}`}>{result.text}</p>
          </section>
        )}
      </div>
    </main>
  )
}