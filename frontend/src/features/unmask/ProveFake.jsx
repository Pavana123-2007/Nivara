import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { compareImages } from '../../api.js'
import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'
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
  const { t } = useI18n()
  return (
    <div className="ui-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontWeight: 700, margin: 0 }}>{label}</p>
      <p className="ui-muted" style={{ minHeight: 44, marginBottom: 10 }}>{hint}</p>
      {preview && (
        <div className="overflow-hidden rounded-card [&_img]:h-48 [&_img]:w-full [&_img]:object-cover">
          <BlurReveal src={preview} alt={label} />
        </div>
      )}
      {/* margin-top: auto pushes the button to the bottom so both cards line up */}
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <label className="ui-drop">
          <Icon name="upload" size={18} />
          {file ? t('common.chooseOther') : t('common.chooseImage')}
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
  const { t, locale } = useI18n()
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
      setError(e.message || t('common.error'))
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
      setError(e.message || t('common.error'))
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
    <Page title={t('tool.prove')} intro={t('prove.intro')} wide>
      <div className="ui-split">
        {/* Left: inputs */}
        <div className="ui-stack">
          <div className="ui-row">
            <Picker label={t('prove.fake')} hint={t('prove.fakeHint')} file={fake} onPick={setFake} preview={fakeUrl} />
            <Picker label={t('prove.original')} hint={t('prove.originalHint')} file={original} onPick={setOriginal} preview={originalUrl} />
          </div>

          <button onClick={check} disabled={!fake || !original || loading} className="ui-btn">
            {busy === 'check' ? t('prove.checking') : t('prove.check')}
          </button>

          <button onClick={findAndCheck} disabled={!fake || loading} className="ui-btn ui-btn-outline">
            {busy === 'search' ? t('prove.searching') : t('prove.findVault')}
          </button>

          {search?.found && (
            <p className="ui-msg ui-msg-info">
              {t('prove.foundVault', {
                date: new Date(search.savedAt).toLocaleDateString(locale),
                score: Math.round(search.score * 100),
              })}
            </p>
          )}

          {search && !search.found && (
            <p className="ui-msg ui-msg-info">
              {t('prove.notInVault', { count: search.checked })}
              {search.bestScore != null && ` ${t('prove.closest', { score: Math.max(0, Math.round(search.bestScore * 100)) })}`}
            </p>
          )}

          {error && <p role="alert" className="ui-msg ui-msg-error">{t(error)}</p>}
        </div>

        {/* Right: result */}
        <div className="lg:sticky lg:top-6">
          {!clues && !result && (
            <div className="ui-card ui-card-dashed hidden lg:block">
              <p className="ui-h2">{t('prove.waitTitle')}</p>
              <p className="ui-muted">{t('prove.waitText')}</p>
            </div>
          )}

          {clues && <CluesCard clues={clues} />}

          {result && result.verdict === 'manipulated' && (
            <section className="ui-card ui-card-danger" aria-live="polite">
              <h2 className="ui-h2 ui-danger-text" style={{ fontSize: 20 }}>
                {t('prove.fakeTitle', { similarity: result.similarity })}
              </h2>
              <p className="ui-muted" style={{ marginBottom: 12 }}>{t('prove.boxes')}</p>
              <div className="overflow-hidden rounded-card [&_img]:max-h-[420px] [&_img]:w-full [&_img]:object-contain">
                <BlurReveal src={result.heatmap_png} alt={t('prove.heatmap')} />
              </div>
              {!result.aligned && <p className="ui-small" style={{ marginTop: 8 }}>{t('prove.notAligned')}</p>}
              <div className="ui-stack" style={{ marginTop: 14 }}>
                <button onClick={copyLink} className="ui-btn">
                  <Icon name={copied ? 'check' : 'copy'} size={17} />
                  {copied ? t('prove.linkCopied') : t('prove.copyLink')}
                </button>
                <div className="ui-row">
                  <button onClick={() => navigate('/nivara/report')} className="ui-btn ui-btn-soft">{t('tool.report')}</button>
                  <button onClick={() => navigate('/nivara/takedown')} className="ui-btn ui-btn-soft">{t('tool.takedown')}</button>
                </div>
              </div>
            </section>
          )}

          {result && result.verdict === 'no_major_edits' && (
            <section className="ui-card" aria-live="polite">
              <h2 className="ui-h2">{t('prove.noEdits')}</h2>
              <p className="ui-muted">{t('prove.noEditsText')}</p>
              <button onClick={() => navigate('/nivara/help')} className="ui-btn ui-btn-soft" style={{ marginTop: 12 }}>
                {t('tool.help')}
              </button>
            </section>
          )}
        </div>
      </div>
    </Page>
  )
}
