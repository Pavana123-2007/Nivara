import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLastResult } from './lastResult.js'
import { buildEvidenceReport } from './report.js'
import { loadVaultItems } from './vaultBridge.js'

const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export default function Report() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [vault, setVault] = useState({ items: [], demo: false })
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const proof = getLastResult()
  const originalSha = proof?.verdict === 'manipulated' ? proof.original_sha256 : null

  useEffect(() => {
    loadVaultItems()
      .then((v) => {
        setVault(v)
        // Default: every note, plus the photo that was the original in the check.
        // Her other photos stay out unless she ticks them.
        const start = new Set(
          v.items.filter((it) => it.type === 'note' || (originalSha && it.sha256 === originalSha)).map((it) => it.id),
        )
        setSelected(start)
      })
      .catch(() => setError('Could not open the vault. Unlock Nivara and try again.'))
  }, [originalSha])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function make() {
    setBusy(true)
    setError(null)
    try {
      const items = vault.items.filter((it) => selected.has(it.id))
      await buildEvidenceReport({
        name,
        summary,
        items,
        omitted: vault.items.length - items.length,
        proof,
      })
    } catch (e) {
      setError(`Could not make the PDF: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-nivara-50 px-4 py-6 pb-28 font-sans lg:px-10">
      <div className="mx-auto max-w-md lg:max-w-4xl">
        <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">
          ← Back
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-nivara-900 lg:text-3xl">Evidence report</h1>
        <p className="mt-1 max-w-2xl text-sm text-nivara-700">
          One PDF with the evidence you choose, the proof the image is fake, and how to file a complaint. It is made on
          this phone; nothing is uploaded.
        </p>

        <div className="mt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          {/* Left: details */}
          <div className="grid gap-3 rounded-card bg-white p-4 shadow-sm">
            <label className="text-sm text-nivara-900">
              Your name (optional)
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-sm text-nivara-900">
              What happened, in your words
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </label>
            <p className="text-sm text-nivara-700">
              Proof of fake:{' '}
              <span className="font-medium text-nivara-900">
                {proof?.verdict === 'manipulated' ? 'included' : 'not checked yet'}
              </span>
            </p>
          </div>

          {/* Right: choose evidence */}
          <div className="mt-4 rounded-card bg-white p-4 shadow-sm lg:mt-0">
            <p className="font-medium text-nivara-900">Choose what goes in the report</p>
            <p className="mb-3 text-sm text-nivara-700">
              Notes and the original photo are ticked for you. Your other photos stay private unless you tick them.
              {vault.demo && ' (demo data)'}
            </p>
            {vault.items.length === 0 && <p className="text-sm text-gray-500">Your vault is empty.</p>}
            <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
              {vault.items.map((it) => {
                const isOriginal = originalSha && it.sha256 === originalSha
                return (
                  <li key={it.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-2 hover:bg-nivara-50">
                      <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} />
                      {it.dataUrl ? (
                        <img src={it.dataUrl} alt="" className="h-12 w-12 shrink-0 rounded object-cover blur-sm" />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-nivara-100 text-xs text-nivara-700">
                          Note
                        </span>
                      )}
                      <span className="min-w-0 text-sm">
                        <span className="block truncate text-nivara-900">
                          {it.text ? it.text : it.type === 'photo' ? 'Photo' : it.type}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {fmt(it.created_at)}
                          {isOriginal && <span className="ml-1 font-medium text-danger">· original used in the check</span>}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              {selected.size} of {vault.items.length} item(s) selected
            </p>
          </div>
        </div>

        <button
          onClick={make}
          disabled={busy}
          className="mt-4 w-full rounded-card bg-nivara-600 p-4 font-medium text-white disabled:opacity-40 lg:mx-auto lg:block lg:max-w-md"
        >
          {busy ? 'Making PDF...' : 'Download evidence report'}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </main>
  )
}