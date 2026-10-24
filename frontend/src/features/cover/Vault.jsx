
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addFile, addNote, deleteItem, listItems } from './vault.js'

const pageStyle = {
  minHeight: '100vh',
  background: '#1c1c1e',
  color: '#f5f5f7',
  padding: '24px',
  fontFamily: 'Arial, sans-serif',
}

const cardStyle = {
  background: '#29292d',
  border: '1px solid #48484d',
  borderRadius: '12px',
  padding: '18px',
  marginTop: '20px',
}

const buttonStyle = {
  background: '#333336',
  color: '#ffffff',
  border: '1px solid #55555b',
  borderRadius: '8px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontSize: '14px',
}

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  background: '#29292d',
  color: '#ffffff',
  border: '1px solid #777780',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '15px',
}

function Thumb({ src, label }) {
  const [shown, setShown] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setShown((value) => !value)}
      aria-label={shown ? `Hide ${label}` : `Show ${label}`}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        padding: 0,
        overflow: 'hidden',
        borderRadius: '8px',
        background: '#111113',
        border: '1px solid #48484d',
        cursor: 'pointer',
      }}
    >
      <img
        src={src}
        alt={label}
        style={{
          display: 'block',
          width: '100%',
          maxHeight: '300px',
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
            color: '#ffffff',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          Tap to reveal
        </span>
      )}
    </button>
  )
}

export default function Vault() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [note, setNote] = useState('')
  const [type, setType] = useState('photo')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function refresh() {
    try {
      const savedItems = await listItems()
      setItems(savedItems)
      setError(null)
    } catch (err) {
      setError(err.message || 'Could not load the vault.')
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
      setError(err.message || 'Something went wrong.')
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
          throw new Error('Please select image files only.')
        }
        await addFile(file, type)
      }
    })
  }

  function onNote() {
    const text = note.trim()
    if (!text) {
      setError('Write a note before saving.')
      return
    }

    run(async () => {
      await addNote(text)
      setNote('')
    })
  }

  function onDelete(id) {
    if (
      window.confirm(
        'Delete this item from the vault? This cannot be undone.',
      )
    ) {
      run(() => deleteItem(id))
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/nivara')}
          style={{
            ...buttonStyle,
            marginBottom: '20px',
          }}
        >
          ← Back
        </button>

        <h1 style={{ fontSize: '30px', margin: '0 0 10px' }}>
          Evidence vault
        </h1>

        <p style={{ color: '#c4c4ce', lineHeight: 1.6 }}>
          Saved here, locked with your code. Nothing goes to your
          gallery or online. Each item gets a fingerprint and the
          time you saved it.
        </p>

        <section style={cardStyle}>
          <h2 style={{ fontSize: '20px', marginTop: 0 }}>
            Add evidence
          </h2>

          <p style={{ color: '#c4c4ce', marginBottom: '12px' }}>
            Choose what type of image you want to save.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '18px',
            }}
          >
            {['photo', 'screenshot'].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setType(value)}
                aria-pressed={type === value}
                style={{
                  ...buttonStyle,
                  background: type === value ? '#7654d6' : '#333336',
                  borderColor: type === value ? '#a994ff' : '#55555b',
                }}
              >
                {type === value ? '✓ ' : ''}
                {value === 'photo' ? 'Photo' : 'Screenshot'}
              </button>
            ))}
          </div>

          <label
            htmlFor="vault-images"
            style={{ display: 'block', marginBottom: '8px' }}
          >
            Select images
          </label>

          <input
            id="vault-images"
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={onFiles}
            style={{
              ...inputStyle,
              marginBottom: '12px',
            }}
          />

          <p style={{ color: '#c4c4ce', fontSize: '13px' }}>
            Images are encrypted before being saved.
          </p>
        </section>

        <section style={cardStyle}>
          <h2 style={{ fontSize: '20px', marginTop: 0 }}>
            Add a private note
          </h2>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Write a note..."
            rows={5}
            disabled={busy}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.6,
            }}
          />

          <button
            type="button"
            onClick={onNote}
            disabled={busy || !note.trim()}
            style={{
              ...buttonStyle,
              marginTop: '12px',
              background: '#7654d6',
              opacity: busy || !note.trim() ? 0.6 : 1,
            }}
          >
            {busy ? 'Saving...' : 'Save note'}
          </button>
        </section>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#492326',
              color: '#ffb8bd',
              borderRadius: '8px',
            }}
          >
            {error}
          </p>
        )}

        <h2 style={{ fontSize: '22px', marginTop: '28px' }}>
          Saved ({items.length})
        </h2>

        {items.length === 0 && !error && (
          <p style={{ color: '#c4c4ce', marginTop: '12px' }}>
            Nothing saved yet. Add an image or write a note above.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {items.map((item) => (
            <article
              key={item.id}
              style={{
                ...cardStyle,
                marginTop: 0,
                minWidth: 0,
              }}
            >
              <p style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                {item.type}
              </p>

              <p
                style={{
                  fontSize: '12px',
                  color: '#c4c4ce',
                  marginTop: '8px',
                }}
              >
                Saved {new Date(item.created_at).toLocaleString()}
              </p>

              {item.dataUrl && (
                <div style={{ marginTop: '14px' }}>
                  <Thumb
                    src={item.dataUrl}
                    label={item.type}
                  />
                </div>
              )}

              {item.text && (
                <p
                  style={{
                    marginTop: '14px',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </p>
              )}

              <p
                style={{
                  marginTop: '14px',
                  fontSize: '11px',
                  color: '#c4c4ce',
                  overflowWrap: 'anywhere',
                }}
              >
                SHA-256: {item.sha256}
              </p>

              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={busy}
                style={{
                  ...buttonStyle,
                  color: '#ffb8bd',
                  marginTop: '12px',
                }}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
