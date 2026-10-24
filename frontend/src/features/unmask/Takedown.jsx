import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEGAL_REFERENCE, PLATFORMS } from './helplines.js'
import { getLastResult } from './lastResult.js'

function buildComplaint({ platform, link, date, name, contact, proof }) {
  const proofLine = proof?.verifyUrl
    ? `Independent verification that it is manipulated: ${proof.verifyUrl}\nSHA-256 fingerprint of the image: ${proof.fake_sha256}\n`
    : ''
  return `To: The Grievance Officer, ${platform.name}
Subject: URGENT – removal of a morphed / non-consensual intimate image of me

Dear Grievance Officer,

I am reporting content on ${platform.name} that shows a manipulated (morphed) image of me, created and shared without my consent.

Link to the content: ${link || '[paste the link]'}
Date I first saw it: ${date || '[date]'}

This image was edited from my original photograph.
${proofLine}
Under ${LEGAL_REFERENCE}, intermediaries must remove morphed and non-consensual intimate images within 2 hours of a complaint from the person shown.

I request that you:
1. Remove this content and any copies of it within 2 hours of this complaint.
2. Preserve the uploader's account details and logs, as I may file a police complaint.
3. Confirm the removal to me in writing.

I did not consent to this image being created or shared.

${name || '[Your name]'}
${contact || '[Your email or phone]'}
`
}

export default function Takedown() {
  const navigate = useNavigate()
  const proof = getLastResult()
  const [platformId, setPlatformId] = useState('instagram')
  const [link, setLink] = useState('')
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [copied, setCopied] = useState(false)

  const platform = PLATFORMS.find((p) => p.id === platformId)
  const text = useMemo(
    () => buildComplaint({ platform, link, date, name, contact, proof }),
    [platform, link, date, name, contact, proof],
  )

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `Takedown_${platform.name.replace(/\W+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-nivara-50 p-4 font-sans">
      <button onClick={() => navigate('/nivara')} className="text-sm text-nivara-700">← Back</button>
      <h1 className="mt-2 text-2xl font-semibold text-nivara-900">Get it taken down</h1>
      <p className="mt-1 text-sm text-nivara-700">
        Platforms must remove morphed images within 2 hours of your complaint. Fill in what you know; the rest can stay blank.
      </p>

      <div className="mt-4 grid gap-3 rounded-card bg-white p-4 shadow-sm">
        <label className="text-sm text-nivara-900">
          Where was it posted?
          <select value={platformId} onChange={(e) => setPlatformId(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-nivara-900">
          Link to the post
          <input value={link} onChange={(e) => setLink(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm text-nivara-900">
          Date you first saw it
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm text-nivara-900">
          Your name (optional)
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm text-nivara-900">
          Email or phone for their reply (optional)
          <input value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
      </div>

      <pre className="mt-4 whitespace-pre-wrap rounded-card bg-white p-4 text-xs text-gray-800 shadow-sm">{text}</pre>

      <div className="mt-3 grid gap-2">
        <button onClick={copy} className="rounded-card bg-nivara-600 p-3 text-white">{copied ? 'Copied' : 'Copy complaint'}</button>
        <button onClick={download} className="rounded-card bg-nivara-100 p-3 text-nivara-900">Download as text file</button>
        {platform.url && (
          <a href={platform.url} target="_blank" rel="noreferrer" className="rounded-card bg-nivara-100 p-3 text-center text-nivara-900">
            Open {platform.name} help pages
          </a>
        )}
      </div>
    </main>
  )
}