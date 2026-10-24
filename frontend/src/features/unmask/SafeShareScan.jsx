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
  const [message, setMessage] = useState(null)

  async function scan() {
    setBusy(true)
    setMessage(null)
    try {
      const r = await safeShareScan(file)
      if (!r.found) {
        setMessage('No mark found. The image may have been heavily compressed or edited.')
      } else {
        const name = await nameFor(r.recipient_id)
        const who = name ? `the copy you sent to ${name}` : `copy ${r.recipient_id}`
        const sure = r.confidence === 'high' ? '' : ' (low confidence: treat as a lead, not proof)'
        setMessage(`This photo came from ${who}${sure}.`)
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-nivara-50 p-4 font-sans">
      <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">← Back</button>
      <h1 className="mt-2 text-2xl font-semibold text-nivara-900">Who leaked this photo?</h1>
      <p className="mt-1 text-sm text-nivara-700">Choose the leaked photo. Nivara checks for the hidden mark in your Safe Share copies.</p>
      <label className="mt-4 block cursor-pointer rounded-card border-2 border-dashed border-nivara-500 bg-white p-4 text-center text-sm text-nivara-700">
        {file ? file.name : 'Choose the leaked photo'}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <button onClick={scan} disabled={!file || busy} className="mt-4 w-full rounded-card bg-nivara-600 p-4 text-white disabled:opacity-40">
        {busy ? 'Checking...' : 'Check for the mark'}
      </button>
      {message && <p className="mt-4 rounded-card bg-white p-4 text-nivara-900" aria-live="polite">{message}</p>}
    </main>
  )
}