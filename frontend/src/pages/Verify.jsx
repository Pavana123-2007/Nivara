import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getVerification } from '../api.js'

export default function Verify() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const pageUrl = window.location.href

  useEffect(() => {
    document.title = 'Image verification'
    getVerification(id)
      .then(setData)
      .catch((e) => setError(e.status === 404 ? 'This verification link does not exist.' : 'Could not load this page. Please try again.'))
  }, [id])

  async function copy() {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = encodeURIComponent(
    `This image has been verified as manipulated (edited from an original photo). Please don't believe or forward it: ${pageUrl}`,
  )

  return (
    <main className="min-h-screen bg-white p-4 font-sans">
      <div className="mx-auto max-w-md">
        <p className="text-sm text-gray-500">Image verification</p>
        {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
        {!error && !data && <p className="mt-4">Checking...</p>}
        {data && (
          <>
            <div className="mt-3 rounded-card border-2 border-danger p-4">
              <h1 className="text-2xl font-semibold text-danger">This image has been verified as MANIPULATED</h1>
              <p className="mt-2 text-gray-800">
                It was compared with the original photo it was made from. Only {data.similarity}% of it matches the
                original; the rest was edited.
              </p>
            </div>

            <img src={data.blurred_thumb} alt="Blurred preview of the manipulated image" className="mt-4 w-40 rounded-card" />

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Checked on</dt>
                <dd>{new Date(data.checked_at).toLocaleString('en-IN')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Image fingerprint (SHA-256)</dt>
                <dd className="break-all font-mono text-xs">{data.fake_sha256}</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm text-gray-700">
              Sharing a morphed image of someone is a crime. If you received this image, please delete it and don't
              forward it.
            </p>

            <div className="mt-4 grid gap-2">
              <button onClick={copy} className="rounded-card bg-nivara-600 p-3 text-white">{copied ? 'Link copied' : 'Copy this link'}</button>
              <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="rounded-card bg-safe p-3 text-center text-white">
                Share on WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}