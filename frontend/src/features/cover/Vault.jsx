import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n.jsx'
import { Icon } from '../../icons.jsx'
import { Page } from '../../ui.jsx'
import { addFile, addNote, deleteItem, listItems } from './vault.js'

// Saved photos stay blurred until tapped, in case someone glances at the screen
function Thumb({ src, label }) {
  const { t } = useI18n()
  const [shown, setShown] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setShown((value) => !value)}
      aria-label={shown ? label : `${t('common.tapToShow')}: ${label}`}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        padding: 0,
        overflow: 'hidden',
        borderRadius: 10,
        background: 'var(--surface-2)',
      }}
    >
      <img
        src={src}
        alt={label}
        style={{
          display: 'block',
          width: '100%',
          maxHeight: 300,
          objectFit: 'contain',
          filter: shown ? 'none' : 'blur(18px)',
        }}
      />
      {!shown && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 650,
            background: 'rgba(24, 23, 28, 0.28)',
          }}
        >
          {t('common.tapToShow')}
        </span>
      )}
    </button>
  )
}

export default function Vault() {
  const { t, locale } = useI18n()
  const [items, setItems] = useState([])
  const [note, setNote] = useState('')
  const [type, setType] = useState('photo')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null) // a translation key or a message

  const typeName = (value) => (value === 'note' ? t('vault.note') : value === 'screenshot' ? t('vault.screenshot') : t('vault.photo'))

  async function refresh() {
    try {
      const savedItems = await listItems()
      setItems(savedItems)
      setError(null)
    } catch (err) {
      setError(err.message || 'vault.loadError')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function run(task) {
    setBusy(true)
    setError(null)

    try {
      await task()
      await refresh()
    } catch (err) {
      setError(err.message || 'common.error')
    } finally {
      setBusy(false)
    }
  }

  function onFiles(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''

    if (!files.length) return

    run(async () => {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error('vault.imagesOnly')
        }
        await addFile(file, type)
      }
    })
  }

  function onNote() {
    const text = note.trim()
    if (!text) {
      setError('vault.writeFirst')
      return
    }

    run(async () => {
      await addNote(text)
      setNote('')
    })
  }

  function onDelete(id) {
    if (window.confirm(t('vault.confirmDelete'))) {
      run(() => deleteItem(id))
    }
  }

  return (
    <Page title={t('tool.vault')} intro={t('vault.intro')} wide>
      <div className="ui-row">
        <section className="ui-card ui-stack" style={{ alignContent: 'start' }}>
          <h2 className="ui-h2">{t('vault.add')}</h2>
          <p className="ui-muted">{t('vault.typeHint')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['photo', 'screenshot'].map((value) => (
              <button type="button" key={value} onClick={() => setType(value)} aria-pressed={type === value} className="ui-chip">
                {type === value && <Icon name="check" size={16} />}
                {typeName(value)}
              </button>
            ))}
          </div>
          <label className="ui-drop">
            <Icon name="upload" size={18} />
            {busy ? t('vault.saving') : t('vault.select')}
            <input type="file" accept="image/*" multiple disabled={busy} onChange={onFiles} className="sr-only" />
          </label>
          <p className="ui-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="lock" size={14} />
            {t('vault.encrypted')}
          </p>
        </section>

        <section className="ui-card ui-stack" style={{ alignContent: 'start' }}>
          <h2 className="ui-h2">{t('vault.noteTitle')}</h2>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('vault.notePlaceholder')}
            rows={5}
            disabled={busy}
            className="ui-input"
            style={{ resize: 'vertical', lineHeight: 1.6, marginTop: 0 }}
          />
          <button type="button" onClick={onNote} disabled={busy || !note.trim()} className="ui-btn">
            {busy ? t('vault.saving') : t('vault.saveNote')}
          </button>
        </section>
      </div>

      {error && <p role="alert" className="ui-msg ui-msg-error" style={{ marginTop: 14 }}>{t(error)}</p>}

      <h2 className="ui-h2" style={{ fontSize: 21, marginTop: 28 }}>{t('vault.saved', { n: items.length })}</h2>

      {items.length === 0 && !error && <p className="ui-muted" style={{ marginTop: 8 }}>{t('vault.empty')}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
          marginTop: 14,
        }}
      >
        {items.map((item) => (
          <article key={item.id} className="ui-card" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ fontWeight: 700, margin: 0 }}>{typeName(item.type)}</p>
              <p className="ui-small">{t('vault.savedAt', { date: new Date(item.created_at).toLocaleString(locale) })}</p>
            </div>

            {item.dataUrl && <Thumb src={item.dataUrl} label={typeName(item.type)} />}

            {item.text && (
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.6 }}>{item.text}</p>
            )}

            <p className="ui-small" style={{ overflowWrap: 'anywhere', fontSize: 11 }}>SHA-256: {item.sha256}</p>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={busy}
              className="ui-btn ui-btn-outline"
              style={{ marginTop: 'auto', minHeight: 40, color: 'var(--danger-ink)' }}
            >
              <Icon name="trash" size={16} />
              {t('vault.delete')}
            </button>
          </article>
        ))}
      </div>
    </Page>
  )
}
