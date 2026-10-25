import { useState } from 'react'
import { safeShareScan } from '../../api.js'
import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'

const mods = import.meta.glob('../cover/safeshare.js')

async function nameFor(id) {
  const loader = mods['../cover/safeshare.js']
  if (!loader) return null
  const mod = await loader()
  return mod.getRecipientName(id)
}

export default function SafeShareScan() {
  const { t } = useI18n()
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { kind: 'found' | 'none' | 'error', text }

  async function scan() {
    setBusy(true)
    setResult(null)
    try {
      const r = await safeShareScan(file)
      if (!r.found) {
        setResult({ kind: 'none', text: t('scan.noneText') })
      } else {
        const name = await nameFor(r.recipient_id)
        const who = name ? t('scan.fromName', { name }) : t('scan.fromId', { id: r.recipient_id })
        const sure = r.confidence === 'high' ? '' : ` ${t('scan.low')}`
        setResult({ kind: 'found', text: who + sure })
      }
    } catch (e) {
      setResult({ kind: 'error', text: e.message || t('common.error') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page title={t('tool.scan')} intro={t('scan.intro')}>
      <section className="ui-card ui-stack">
        <label className="ui-drop">
          <Icon name={file ? 'image' : 'upload'} size={18} />
          {file ? file.name : t('scan.choose')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setResult(null)
            }}
          />
        </label>
        <button onClick={scan} disabled={!file || busy} className="ui-btn">
          {busy ? t('scan.checking') : t('scan.check')}
        </button>
      </section>

      {result && result.kind === 'error' && (
        <p role="alert" className="ui-msg ui-msg-error" style={{ marginTop: 14 }}>{t(result.text)}</p>
      )}
      {result && result.kind !== 'error' && (
        <section className={`ui-card${result.kind === 'found' ? ' ui-card-danger' : ''}`} style={{ marginTop: 14 }} aria-live="polite">
          <h2 className={`ui-h2${result.kind === 'found' ? ' ui-danger-text' : ''}`}>
            {result.kind === 'found' ? t('scan.found') : t('scan.none')}
          </h2>
          <p className="ui-muted">{result.text}</p>
        </section>
      )}
    </Page>
  )
}
