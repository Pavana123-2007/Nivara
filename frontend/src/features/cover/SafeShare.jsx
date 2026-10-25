import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { safeShareMark } from '../../api.js'
import { newRecipientIds, saveRecipients } from './safeshare.js'

export default function SafeShare() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [names, setNames] = useState('')
  const [copies, setCopies] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const list = names.split('\n').map((n) => n.trim()).filter(Boolean).slice(0, 10)

  async function make() {
    setBusy(true)
    setError(null)
    try {
      const ids = await newRecipientIds(list.length)
      const res = await safeShareMark(file, ids)
      const pairs = ids.map((id, i) => ({ id, name: list[i] }))
      await saveRecipients(pairs)
      setCopies(res.copies.map((c) => ({ ...c, name: pairs.find((p) => p.id === c.recipient_id)?.name })))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-nivara-50 p-4 pb-24 font-sans">
      <button onClick={() => navigate('/nivara')} className="min-h-11 text-sm text-nivara-700">← Back</button>
      <h1 className="text-2xl font-semibold text-nivara-900">Safe Share</h1>
      <p className="mt-1 text-sm text-nivara-700">
        Each person gets a copy that looks the same but carries an invisible mark. If a photo leaks, Nivara can show whose
        copy it was. Names stay on this phone.
      </p>
      <section className="mt-4 grid gap-3 rounded-card bg-white p-4 shadow-sm">
        <label className="block min-h-11 cursor-pointer rounded-card border-2 border-dashed border-nivara-500 p-3 text-center text-sm text-nivara-700">
          {file ? file.name : 'Choose a photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="text-sm text-nivara-900">
          Who are you sending it to? One name per line (max 10)
          <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <button onClick={make} disabled={!file || !list.length || busy} className="min-h-11 rounded-card bg-nivara-600 p-3 text-white disabled:opacity-40">
          {busy ? 'Making copies...' : `Make ${list.length || ''} marked copies`}
        </button>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </section>
      {copies.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {copies.map((c) => (
            <li key={c.recipient_id} className="flex items-center justify-between rounded-card bg-white p-3 shadow-sm">
              <span className="text-nivara-900">For {c.name}</span>
              <a href={c.image} download={`photo_${c.recipient_id}.${c.image.startsWith('data:image/png') ? 'png' : 'jpg'}`} className="min-h-11 rounded-lg bg-nivara-100 px-4 py-3 text-sm text-nivara-900">Download</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
