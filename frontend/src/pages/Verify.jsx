import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getVerification } from '../api.js'
import { Icon } from '../icons.jsx'

// Public page anyone can open from a shared link, so it stays in English and never names the person.
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
    <main className="ui-page" style={{ paddingBottom: 48 }}>
      <div className="ui-wrap" style={{ maxWidth: 480 }}>
        <p className="ui-small" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 0 10px', fontWeight: 600 }}>
          <Icon name="shield" size={15} />
          Image verification
        </p>

        {error && <p role="alert" className="ui-msg ui-msg-error">{error}</p>}
        {!error && !data && <p className="ui-muted">Checking…</p>}

        {data && (
          <div className="ui-stack" style={{ gap: 16 }}>
            <section className="ui-card ui-card-danger">
              <p className="ui-small" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-ink)', fontWeight: 650 }}>
                <Icon name="alert" size={16} />
                Verified manipulated
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-.01em', lineHeight: 1.3, margin: '8px 0 6px' }}>
                This image was edited from an original photo
              </h1>
              <p className="ui-muted">
                It was compared with the photo it was made from: {data.similarity}% of the picture matches, and the rest
                was changed.
              </p>
            </section>

            <section className="ui-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <img
                src={data.blurred_thumb}
                alt="Blurred preview of the manipulated image"
                style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, flex: 'none' }}
              />
              <dl style={{ margin: 0, display: 'grid', gap: 10, minWidth: 0 }}>
                <div>
                  <dt className="ui-small">Checked on</dt>
                  <dd style={{ margin: 0, fontWeight: 550 }}>{new Date(data.checked_at).toLocaleString('en-IN')}</dd>
                </div>
                <div>
                  <dt className="ui-small">Image fingerprint (SHA-256)</dt>
                  <dd style={{ margin: 0, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, overflowWrap: 'anywhere', color: 'var(--ink-2)' }}>
                    {data.fake_sha256}
                  </dd>
                </div>
              </dl>
            </section>

            <p className="ui-muted">
              Sharing a morphed image of someone is a crime. If you received this image, please delete it and don't
              forward it.
            </p>

            <div className="ui-row">
              <button onClick={copy} className="ui-btn ui-btn-outline">
                <Icon name={copied ? 'check' : 'copy'} size={17} />
                {copied ? 'Link copied' : 'Copy this link'}
              </button>
              <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="ui-btn">
                <Icon name="send" size={17} />
                Share on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
