import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { compareImages } from '../../api.js'
import BlurReveal from './BlurReveal.jsx'
import CluesCard from './CluesCard.jsx'
import { setLastResult } from './lastResult.js'
import { findSource, itemToFile } from './findSource.js'
import { loadVaultItems } from './vaultBridge.js'
import { getClues } from './clues.js'

function usePreview(file) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function Picker({ label, hint, file, onPick, preview }) {
  return (
    <div className="flex flex-col rounded-card bg-white p-4 shadow-sm">
      <p className="font-medium text-nivara-900">{label}</p>
      <p className="mb-3 min-h-10 text-sm text-nivara-700">{hint}</p>
      {preview && (
        <div className="overflow-hidden rounded-card [&_img]:h-48 [&_img]:w-full [&_img]:object-cover">
          <BlurReveal src={preview} alt={label} />
        </div>
      )}
      {/* mt-auto pushes the button to the bottom so both cards line up */}
      <div className="mt-auto pt-3">
        <label className="block cursor-pointer rounded-card border-2 border-dashed border-nivara-500 p-3 text-center text-sm text-nivara-700">
          {file ? 'Choose a different image' : 'Choose image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </div>
  )
}

export default function ProveFake() {
  const navigate = useNavigate()
  const [fake, setFake] = useState(null)
  const [original, setOriginal] = useState(null)
  const [busy, setBusy] = useState(null) // 'check' | 'search' | null
  const loading = busy !== null
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState(null)
  const [clues, setClues] = useState(null)
  const fakeUrl = usePreview(fake)
  const originalUrl = usePreview(original)

  const verifyUrl = result?.verify_id ? `${window.location.origin}/verify/${result.verify_id}` : null

  async function check() {
    setBusy('check')
    setError(null)
    setResult(null)
    setClues(null)
    try {
      const r = await compareImages(fake, original)
      setResult(r)
      setLastResult({
        ...r,
        verifyUrl: r.verify_id ? `${window.location.origin}/verify/${r.verify_id}` : null,
      })
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function findAndCheck() {
    setBusy('search')
    setError(null)
    setResult(null)
    setSearch(null)
    setClues(null)
    try {
      const { items, demo } = await loadVaultItems()
      const { match, best, checked } = await findSource(fake, demo ? [] : items)
      if (!match) {
        setSearch({ found: false, checked, bestScore: best ? best.score : null })
        setClues(await getClues(fake))
        return
      }
      const originalFile = await itemToFile(match.item)
      setOriginal(originalFile)
      setSearch({ found: true, checked, score: match.score, savedAt: match.item.created_at })
      const r = await compareImages(fake, originalFile)
      setResult(r)
      setLastResult({
        ...r,
        verifyUrl: r.verify_id ? `${window.location.origin}/verify/${r.verify_id}` : null,
      })
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-nivara-50 px-4 py-6 pb-28 font-sans lg:px-10">
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">
          ← Back
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-nivara-900 lg:text-3xl">Prove it's fake</h1>
        <p className="mt-1 max-w-2xl text-sm text-nivara-700">
          This is a crime against you, not your fault. Nivara compares the fake with your original and shows exactly
          what was changed.
        </p>

        <div className="mt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          {/* Left: inputs */}
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Picker label="The fake image" hint="The one being shared or used to threaten you" file={fake} onPick={setFake} preview={fakeUrl} />
              <Picker label="Your original photo" hint="The real photo it was made from" file={original} onPick={setOriginal} preview={originalUrl} />
            </div>

            <button
              onClick={check}
              disabled={!fake || !original || loading}
              className="mt-4 w-full rounded-card bg-nivara-600 p-4 font-medium text-white disabled:opacity-40"
            >
              {busy === 'check' ? 'Checking... (about 5 seconds)' : 'Check the image'}
            </button>

            <button
              onClick={findAndCheck}
              disabled={!fake || loading}
              className="mt-2 w-full rounded-card border-2 border-nivara-600 bg-white p-4 font-medium text-nivara-700 disabled:opacity-40"
            >
              {busy === 'search' ? 'Searching your vault...' : 'I only have the fake – find the original in my vault'}
            </button>

            {search?.found && (
              <p className="mt-3 rounded-card bg-nivara-100 p-3 text-sm text-nivara-900">
                Found in your vault: this fake was made from your photo saved on{' '}
                {new Date(search.savedAt).toLocaleDateString()} ({Math.round(search.score * 100)}% match). It is now
                shown as "Your original photo".
              </p>
            )}

            {search && !search.found && (
              <p className="mt-3 rounded-card bg-white p-3 text-sm text-nivara-900">
                No matching photo in your vault (checked {search.checked} photo{search.checked === 1 ? '' : 's'}
                {search.bestScore != null ? `, closest ${Math.max(0, Math.round(search.bestScore * 100))}%` : ''}).
              </p>
            )}

            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          </div>

          {/* Right: result */}
          <div className="lg:sticky lg:top-6">
            {!clues && !result && (
              <div className="mt-4 hidden rounded-card border-2 border-dashed border-nivara-500/40 p-8 text-center text-sm text-nivara-700 lg:mt-0 lg:block">
                <p className="text-base font-medium text-nivara-900">Your result will appear here</p>
                <p className="mt-1">Add the fake (and your original if you have it), then check.</p>
              </div>
            )}

            {clues && (
              <div className="lg:[&>section]:mt-0">
                <CluesCard clues={clues} />
              </div>
            )}

            {result && result.verdict === 'manipulated' && (
              <section className="mt-4 rounded-card border-2 border-danger bg-white p-4 lg:mt-0" aria-live="polite">
                <h2 className="text-xl font-semibold text-danger">FAKE – {result.similarity}% identical, edited here</h2>
                <p className="mt-1 mb-3 text-sm text-gray-700">
                  The coloured boxes show what was changed, drawn on your original photo.
                </p>
                <div className="overflow-hidden rounded-card [&_img]:max-h-[420px] [&_img]:w-full [&_img]:object-contain">
                  <BlurReveal src={result.heatmap_png} alt="heatmap of edited areas" />
                </div>
                {!result.aligned && (
                  <p className="mt-2 text-xs text-gray-500">
                    The images could not be lined up exactly, so this result is less certain.
                  </p>
                )}
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button onClick={copyLink} className="rounded-card bg-nivara-600 p-3 text-sm text-white">
                    {copied ? 'Link copied' : 'Copy verify link'}
                  </button>
                  <button onClick={() => navigate('/nivara/report')} className="rounded-card bg-nivara-100 p-3 text-sm text-nivara-900">
                    Evidence report
                  </button>
                  <button onClick={() => navigate('/nivara/takedown')} className="rounded-card bg-nivara-100 p-3 text-sm text-nivara-900">
                    Takedown complaint
                  </button>
                </div>
              </section>
            )}

            {result && result.verdict === 'no_major_edits' && (
              <section className="mt-4 rounded-card bg-white p-4 lg:mt-0" aria-live="polite">
                <h2 className="text-lg font-semibold text-nivara-900">No major edits found</h2>
                <p className="mt-1 text-sm text-gray-700">
                  This doesn't prove the image is real. It may have been made from a different photo. You can still get
                  help and report it.
                </p>
                <button onClick={() => navigate('/nivara/help')} className="mt-3 w-full rounded-card bg-nivara-100 p-3 text-nivara-900">
                  Get help
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}