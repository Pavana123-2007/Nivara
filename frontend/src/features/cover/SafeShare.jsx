import { useState } from 'react'
import { safeShareMark } from '../../api.js'
import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'
import { newRecipientIds, saveRecipients } from './safeshare.js'

export default function SafeShare() {
  const { t } = useI18n()
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
      setError(e.message || t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title={t('tool.safeshare')} intro={t('share.intro')}>
      <section className="ui-card ui-stack">
        <label className="ui-drop">
          <Icon name={file ? 'image' : 'upload'} size={18} />
          {file ? file.name : t('share.choose')}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="ui-label">
          {t('share.who')}
          <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={4} className="ui-input" />
        </label>
        <button onClick={make} disabled={!file || !list.length || busy} className="ui-btn">
          {busy ? t('share.making') : list.length ? t('share.make', { n: list.length }) : t('share.makeNone')}
        </button>
        <p className="ui-small">{t('share.tip')}</p>
        {error && <p role="alert" className="ui-msg ui-msg-error">{t(error)}</p>}
      </section>

      {copies.length > 0 && (
        <ul className="ui-stack" style={{ marginTop: 14, padding: 0, listStyle: 'none' }}>
          {copies.map((c) => (
            <li key={c.recipient_id} className="ui-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px 12px 18px' }}>
              <span style={{ fontWeight: 650 }}>{t('share.for', { name: c.name })}</span>
              <a
                href={c.image}
                download={`photo_${c.recipient_id}.${c.image.startsWith('data:image/png') ? 'png' : 'jpg'}`}
                className="ui-btn ui-btn-soft"
                style={{ width: 'auto', minHeight: 44 }}
              >
                <Icon name="download" size={16} />
                {t('share.download')}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
