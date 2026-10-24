import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLastResult } from './lastResult.js'
import { buildEvidenceReport } from './report.js'
import { loadVaultItems } from './vaultBridge.js'

export default function Report() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [includePhotos, setIncludePhotos] = useState(true)
  const [vault, setVault] = useState({ items: [], demo: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const proof = getLastResult()

  useEffect(() => {
    loadVaultItems()
      .then(setVault)
      .catch(() => setError('Could not open the vault. Unlock Nivara and try again.'))
  }, [])

  async function make() {
    setBusy(true)
    setError(null)
    try {
      await buildEvidenceReport({ name, summary, items: vault.items, proof, includePhotos })
    } catch (e) {
      setError(`Could not make the PDF: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-nivara-50 p-4 font-sans">
      <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">← Back</button>
      <h1 className="mt-2 text-2xl font-semibold text-nivara-900">Evidence report</h1>
      <p className="mt-1 text-sm text-nivara-700">
        One PDF with your saved evidence, the proof the image is fake, and how to file a complaint. It is made on
        this phone; nothing is uploaded.
      </p>

      <div className="mt-4 grid gap-3 rounded-card bg-white p-4 shadow-sm">
        <label className="text-sm text-nivara-900">
          Your name (optional)
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm text-nivara-900">
          What happened, in your words
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="flex items-center gap-2 text-sm text-nivara-900">
          <input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} />
          Include photos from the vault
        </label>
        <ul className="text-sm text-nivara-700">
          <li>Saved evidence items: {vault.items.length}{vault.demo && ' (demo data)'}</li>
          <li>Proof of fake: {proof?.verdict === 'manipulated' ? 'included' : 'not checked yet'}</li>
        </ul>
      </div>

      <button onClick={make} disabled={busy} className="mt-4 w-full rounded-card bg-nivara-600 p-4 font-medium text-white disabled:opacity-40">
        {busy ? 'Making PDF...' : 'Download evidence report'}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </main>
  )
}