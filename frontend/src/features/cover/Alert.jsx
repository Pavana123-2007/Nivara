
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendAlert } from '../../api.js'
import { loadSecret, saveSecret } from './vault.js'

const styles = {
  page: {
    minHeight: '100vh',
    padding: 24,
    background: '#f5f3ed',
    color: '#30244b',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    background: '#fff',
    border: '1px solid #ded9e8',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginTop: 16,
    color: '#30244b',
  },
  input: {
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 44,
    marginTop: 8,
    padding: 12,
    border: '1px solid #c9c2d8',
    borderRadius: 8,
    background: '#fff',
    color: '#30244b',
    fontSize: 16,
  },
  button: {
    width: '100%',
    minHeight: 46,
    marginTop: 18,
    padding: 12,
    border: 0,
    borderRadius: 8,
    background: '#59418c',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
}

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
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [editing, setEditing] = useState(true)
  const [form, setForm] = useState({
    contactName: '',
    chatId: '',
    myName: '',
  })
  const [withLocation, setWithLocation] = useState(false)
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
        if (active) {
          setStatus({
            kind: 'error',
            message: 'Could not load the saved contact. Please unlock Nivara.',
          })
        }
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
      setStatus({
        kind: 'error',
        message: 'Enter the contact name and Telegram chat ID.',
      })
      return
    }

    try {
      await saveSecret('contact', saved)
      setContact(saved)
      setEditing(false)
      setStatus({ kind: 'saved', message: 'Trusted contact saved securely.' })
    } catch {
      setStatus({
        kind: 'error',
        message: 'Could not save. Make sure Nivara is unlocked.',
      })
    }
  }

  async function send() {
    if (!contact?.chatId) return

    setStatus({ kind: 'sending', message: 'Sending alert…' })

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
        message: `Alert sent to ${contact.contactName}${location ? ' with your location' : ''}.`,
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error.message || 'Could not send the alert.',
      })
    }
  }

  function field(name, label, optional = false) {
    return (
      <label key={name} style={styles.label}>
        {label}
        <input
          name={name}
          value={form[name]}
          onChange={updateField}
          required={!optional}
          style={styles.input}
        />
      </label>
    )
  }

  return (
    <main style={styles.page}>
      <button
        type="button"
        onClick={() => navigate('/nivara')}
        style={{
          border: 0,
          background: 'transparent',
          color: '#59418c',
          fontSize: 16,
          cursor: 'pointer',
          padding: '8px 0',
        }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 30, margin: '20px 0 8px' }}>Ask for help</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        Choose one trusted person who can receive your Telegram alert.
      </p>

      {editing ? (
        <section style={styles.card}>
          {field('contactName', 'Trusted contact name')}
          {field('chatId', 'Telegram chat ID')}
          {field('myName', 'Your name in the alert (optional)', true)}

          <button type="button" onClick={save} style={styles.button}>
            Save trusted contact
          </button>
        </section>
      ) : (
        <section style={styles.card}>
          <p style={{ margin: 0, fontSize: 14 }}>Trusted contact</p>
          <h2 style={{ fontSize: 20 }}>{contact?.contactName}</h2>

          <button
            type="button"
            onClick={send}
            disabled={status?.kind === 'sending'}
            style={{
              ...styles.button,
              background: '#b42332',
              opacity: status?.kind === 'sending' ? 0.6 : 1,
            }}
          >
            {status?.kind === 'sending' ? 'Sending…' : 'Send emergency alert'}
          </button>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 18,
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={withLocation}
              onChange={(event) => setWithLocation(event.target.checked)}
            />
            Also share my location (optional)
          </label>

          <button
            type="button"
            onClick={() => {
              setStatus(null)
              setEditing(true)
            }}
            style={{
              ...styles.button,
              background: '#59418c',
            }}
          >
            Change trusted contact
          </button>
        </section>
      )}

      {status && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          style={{
            ...styles.card,
            color: status.kind === 'error' ? '#b42332' : '#17633a',
          }}
        >
          {status.message}
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
        If you are in immediate danger in India, call 112.
      </p>
    </main>
  )
}
