import { useEffect, useState } from 'react'
import { sendAlert } from '../../api.js'
import { useI18n } from '../../i18n.jsx'
import { Page } from '../../ui.jsx'
import { loadSecret, saveSecret } from './vault.js'

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 },
    )
  })
}

export default function Alert() {
  const { t } = useI18n()
  const [contact, setContact] = useState(null)
  const [editing, setEditing] = useState(true)
  const [form, setForm] = useState({
    contactName: '',
    chatId: '',
    myName: '',
  })
  const [withLocation, setWithLocation] = useState(false)
  // message is a translation key; vars fill it, text is a raw server message
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let active = true

    loadSecret('contact')
      .then((saved) => {
        if (!active || !saved) return
        setContact(saved)
        setForm({
          contactName: saved.contactName || '',
          chatId: saved.chatId || '',
          myName: saved.myName || '',
        })
        setEditing(false)
      })
      .catch(() => {
        if (active) setStatus({ kind: 'error', message: 'alert.loadError' })
      })

    return () => {
      active = false
    }
  }, [])

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  async function save() {
    const saved = {
      contactName: form.contactName.trim(),
      chatId: form.chatId.trim(),
      myName: form.myName.trim(),
    }

    if (!saved.contactName || !saved.chatId) {
      setStatus({ kind: 'error', message: 'alert.missing' })
      return
    }

    try {
      await saveSecret('contact', saved)
      setContact(saved)
      setEditing(false)
      setStatus({ kind: 'saved', message: 'alert.savedOk' })
    } catch {
      setStatus({ kind: 'error', message: 'alert.saveError' })
    }
  }

  async function send() {
    if (!contact?.chatId) return

    setStatus({ kind: 'sending', message: 'alert.sendingMsg' })

    try {
      const location = withLocation ? await getLocation() : null

      await sendAlert({
        chatId: contact.chatId,
        name: contact.myName || null,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      })

      setStatus({
        kind: 'sent',
        message: location ? 'alert.sentLoc' : 'alert.sent',
        vars: { name: contact.contactName },
      })
    } catch (error) {
      setStatus({ kind: 'error', message: 'alert.sendError', text: error.message })
    }
  }

  function field(name, label, optional = false) {
    return (
      <label key={name} className="ui-label">
        {label}
        <input name={name} value={form[name]} onChange={updateField} required={!optional} className="ui-input" />
      </label>
    )
  }

  const statusClass = status?.kind === 'error' ? 'ui-msg-error' : status?.kind === 'sending' ? 'ui-msg-info' : 'ui-msg-ok'

  return (
    <Page title={t('tool.alert')} intro={t('alert.intro')}>
      {editing ? (
        <section className="ui-card ui-stack">
          {field('contactName', t('alert.contactName'))}
          {field('chatId', t('alert.chatId'))}
          {field('myName', t('alert.myName'), true)}
          <button type="button" onClick={save} className="ui-btn">
            {t('alert.save')}
          </button>
        </section>
      ) : (
        <section className="ui-card ui-stack">
          <div>
            <p className="ui-small">{t('alert.contact')}</p>
            <p style={{ fontSize: 20, fontWeight: 750, margin: '2px 0 0' }}>{contact?.contactName}</p>
          </div>

          {/* The button reads like an everyday message, in case someone sees the screen */}
          <button
            type="button"
            onClick={send}
            disabled={status?.kind === 'sending'}
            className="ui-btn ui-btn-danger"
            style={{ minHeight: 60, fontSize: 17 }}
          >
            {status?.kind === 'sending' ? t('alert.sending') : t('alert.button')}
          </button>

          <label className="ui-check">
            <input type="checkbox" checked={withLocation} onChange={(event) => setWithLocation(event.target.checked)} />
            {t('alert.location')}
          </label>

          <button
            type="button"
            onClick={() => {
              setStatus(null)
              setEditing(true)
            }}
            className="ui-btn ui-btn-soft"
          >
            {t('alert.change')}
          </button>
        </section>
      )}

      {status && (
        <p role={status.kind === 'error' ? 'alert' : 'status'} className={`ui-msg ${statusClass}`} style={{ marginTop: 14 }}>
          {t(status.message, status.vars)}
          {status.text && ` (${t(status.text)})`}
        </p>
      )}

      <p className="ui-muted" style={{ textAlign: 'center', marginTop: 24, fontWeight: 650 }}>
        {t('common.danger')}
      </p>
    </Page>
  )
}
