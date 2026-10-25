import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'
import { getLastResult } from './lastResult.js'
import { buildEvidenceReport } from './report.js'
import { loadVaultItems } from './vaultBridge.js'

export default function Report() {
  const { t, locale } = useI18n()
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [vault, setVault] = useState({ items: [], demo: false })
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const proof = getLastResult()
  const originalSha = proof?.verdict === 'manipulated' ? proof.original_sha256 : null
  const fmt = (iso) => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })

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
      .catch(() => setError('report.vaultError')) // a key: shown with t() below
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
      setError(t('report.failed', { error: e.message }))
    } finally {
      setBusy(false)
    }
  }

  const label = (it) => (it.text ? it.text : it.type === 'photo' ? t('vault.photo') : it.type === 'screenshot' ? t('vault.screenshot') : it.type)

  return (
    <Page title={t('tool.report')} intro={t('report.intro')} wide>
      <div className="ui-split">
        {/* Left: details */}
        <section className="ui-card ui-stack">
          <label className="ui-label">
            {t('common.yourName')}
            <input value={name} onChange={(e) => setName(e.target.value)} className="ui-input" />
          </label>
          <label className="ui-label">
            {t('report.summary')}
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} className="ui-input" />
          </label>
          <p className="ui-muted">
            {t('report.proof')}{' '}
            <strong style={{ color: proof?.verdict === 'manipulated' ? 'var(--ok)' : 'var(--ink-2)' }}>
              {proof?.verdict === 'manipulated' ? t('report.included') : t('report.notChecked')}
            </strong>
          </p>
        </section>

        {/* Right: choose evidence */}
        <section className="ui-card">
          <h2 className="ui-h2">{t('report.choose')}</h2>
          <p className="ui-muted" style={{ marginBottom: 12 }}>
            {t('report.chooseHint')} {vault.demo && t('report.demo')}
          </p>
          {vault.items.length === 0 && <p className="ui-small">{t('report.empty')}</p>}
          <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1" style={{ padding: 0, listStyle: 'none', margin: 0 }}>
            {vault.items.map((it) => {
              const isOriginal = originalSha && it.sha256 === originalSha
              return (
                <li key={it.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-2 hover:bg-nivara-50">
                    <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} style={{ width: 20, height: 20, accentColor: 'var(--accent)' }} />
                    {it.dataUrl ? (
                      <img src={it.dataUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover blur-sm" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-nivara-100 text-xs text-nivara-700">
                        {t('vault.note')}
                      </span>
                    )}
                    <span className="min-w-0 text-sm">
                      <span className="block truncate" style={{ color: 'var(--ink)' }}>{label(it)}</span>
                      <span className="block text-xs text-gray-500">
                        {fmt(it.created_at)}
                        {isOriginal && <span className="ml-1 font-medium text-danger">· {t('report.originalUsed')}</span>}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          <p className="ui-small" style={{ marginTop: 8 }}>
            {t('report.selected', { n: selected.size, total: vault.items.length })}
          </p>
        </section>
      </div>

      <div style={{ maxWidth: 480, margin: '18px auto 0' }} className="ui-stack">
        <button onClick={make} disabled={busy} className="ui-btn">
          <Icon name="download" size={17} />
          {busy ? t('report.making') : t('report.download')}
        </button>
        <p className="ui-small" style={{ textAlign: 'center' }}>{t('common.englishDoc')}</p>
        {error && <p role="alert" className="ui-msg ui-msg-error">{t(error)}</p>}
      </div>
    </Page>
  )
}
