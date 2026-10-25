import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'
import { LEGAL_REFERENCE, PLATFORMS } from './helplines.js'
import { getLastResult } from './lastResult.js'

// The complaint itself stays in English: platforms' grievance officers expect it.
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
  const { t } = useI18n()
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

  const platformName = (p) => (p.id === 'other' ? t('takedown.other') : p.name)

  return (
    <Page title={t('tool.takedown')} intro={t('takedown.intro')} wide>
      <div className="ui-split">
        <section className="ui-card ui-stack">
          <label className="ui-label">
            {t('takedown.where')}
            <select value={platformId} onChange={(e) => setPlatformId(e.target.value)} className="ui-input">
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{platformName(p)}</option>)}
            </select>
          </label>
          <label className="ui-label">
            {t('takedown.link')}
            <input value={link} onChange={(e) => setLink(e.target.value)} className="ui-input" inputMode="url" />
          </label>
          <label className="ui-label">
            {t('takedown.date')}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ui-input" />
          </label>
          <label className="ui-label">
            {t('common.yourName')}
            <input value={name} onChange={(e) => setName(e.target.value)} className="ui-input" />
          </label>
          <label className="ui-label">
            {t('takedown.contact')}
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="ui-input" />
          </label>
        </section>

        <section className="ui-stack">
          <div className="ui-card">
            <h2 className="ui-h2">{t('takedown.preview')}</h2>
            <p className="ui-small" style={{ marginBottom: 10 }}>{t('common.englishDoc')}</p>
            <pre
              className="whitespace-pre-wrap"
              style={{ margin: 0, maxHeight: 360, overflowY: 'auto', padding: 14, borderRadius: 10, background: 'var(--surface-2)', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', fontFamily: 'inherit' }}
            >
              {text}
            </pre>
          </div>
          <button onClick={copy} className="ui-btn">
            <Icon name={copied ? 'check' : 'copy'} size={17} />
            {copied ? t('common.copied') : t('takedown.copy')}
          </button>
          <div className="ui-row">
            <button onClick={download} className="ui-btn ui-btn-outline">
              <Icon name="download" size={17} />
              {t('takedown.download')}
            </button>
            {platform.url && (
              <a href={platform.url} target="_blank" rel="noreferrer" className="ui-btn ui-btn-outline">
                <Icon name="external" size={17} />
                {t('takedown.openHelp', { platform: platform.name })}
              </a>
            )}
          </div>
        </section>
      </div>
    </Page>
  )
}
