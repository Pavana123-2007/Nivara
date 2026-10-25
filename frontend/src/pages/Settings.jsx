
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  changeCode,
  setDecoyPin,
  isValidCode,
} from '../features/cover/unlock.js'
import {
  motionNeedsPermission,
  requestMotionPermission,
} from '../features/cover/useShake.js'

export default function Settings() {
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [code2, setCode2] = useState('')
  const [decoy, setDecoy] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function saveCode() {
    if (busy) return

    setMsg('')

    if (!isValidCode(code)) {
      setMsg('Enter a new PIN containing 4–8 digits.')
      return
    }

    if (code !== code2) {
      setMsg('The two PINs do not match.')
      return
    }

    if (code === decoy) {
      setMsg('Your secret PIN and decoy PIN must be different.')
      return
    }

    setBusy(true)
    setMsg('Saving your new PIN…')

    try {
      await changeCode(code)

      setCode('')
      setCode2('')
      setMsg(
        'Secret PIN changed successfully. Hide Nivara and test your new PIN.'
      )
    } catch (error) {
      console.error('Failed to change secret PIN:', error)
      setMsg(`Could not change PIN: ${error?.message || 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  async function saveDecoy() {
    if (busy) return

    setMsg('')

    if (!isValidCode(decoy)) {
      setMsg('Enter a decoy PIN containing 4–8 digits.')
      return
    }

    setBusy(true)
    setMsg('Saving your decoy PIN…')

    try {
      await setDecoyPin(decoy)
      setDecoy('')
      setMsg('Decoy PIN saved successfully.')
    } catch (error) {
      console.error('Failed to save decoy PIN:', error)
      setMsg(`Could not save decoy PIN: ${error?.message || 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  async function enableShake() {
    try {
      const granted = await requestMotionPermission()
      setMsg(
        granted
          ? 'Motion permission granted where supported.'
          : 'Permission was not granted. Use Hide Nivara instead.'
      )
    } catch (error) {
      setMsg(error?.message || 'Could not request motion permission.')
    }
  }

  const field = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 14px',
    marginTop: '8px',
    border: '1px solid #ded9e8',
    borderRadius: '10px',
    background: '#fff',
    color: '#30244b',
    fontSize: '15px',
    outlineColor: '#9070d8',
  }

  const button = {
    minHeight: '45px',
    padding: '12px 17px',
    border: 'none',
    borderRadius: '10px',
    background: '#30234c',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 650,
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.65 : 1,
  }

  const card = {
    marginTop: '18px',
    padding: '22px',
    background: '#fff',
    border: '1px solid #e8e1f0',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(47,31,78,.04)',
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8f6fc',
        color: '#30234c',
        padding: '24px 18px 40px',
        fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <header style={{ marginBottom: '25px' }}>
          <button
            type="button"
            style={{
              ...button,
              background: '#fff',
              color: '#30234c',
              border: '1px solid #e4dced',
              marginBottom: '24px',
            }}
            onClick={() => navigate('/nivara')}
          >
            ← Back to Nivara
          </button>

          <p
            style={{
              color: '#9070d8',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              marginBottom: '8px',
            }}
          >
            YOUR PRIVATE SPACE
          </p>

          <h1
            style={{
              fontSize: '32px',
              letterSpacing: '-1px',
              margin: '0 0 10px',
            }}
          >
            Settings
          </h1>

          <p style={{ color: '#81798f', lineHeight: 1.7, margin: 0 }}>
            Manage your secret PIN, decoy PIN, and privacy preferences.
          </p>
        </header>

        <section style={card}>
          <h2 style={{ fontSize: '19px', margin: '0 0 8px' }}>
            Change secret PIN
          </h2>

          <p style={{ color: '#81798f', fontSize: '13px', lineHeight: 1.7 }}>
            Choose a PIN between 4 and 8 digits. Your saved encrypted vault
            items should remain accessible with the new PIN.
          </p>

          <label style={{ display: 'block', marginTop: '17px' }}>
            New secret PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Enter new PIN"
              value={code}
              disabled={busy}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 8))
              }
              style={field}
            />
          </label>

          <label style={{ display: 'block', marginTop: '14px' }}>
            Confirm new PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Enter the same PIN again"
              value={code2}
              disabled={busy}
              onChange={(event) =>
                setCode2(event.target.value.replace(/\D/g, '').slice(0, 8))
              }
              style={field}
            />
          </label>

          <button
            type="button"
            disabled={busy}
            style={{ ...button, width: '100%', marginTop: '17px' }}
            onClick={saveCode}
          >
            {busy ? 'Please wait…' : 'Change secret PIN'}
          </button>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: '19px', margin: '0 0 8px' }}>
            Decoy PIN
          </h2>

          <p style={{ color: '#81798f', fontSize: '13px', lineHeight: 1.7 }}>
            A different PIN opens the harmless Notes page instead of Nivara.
          </p>

          <label style={{ display: 'block', marginTop: '15px' }}>
            New decoy PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Enter decoy PIN"
              value={decoy}
              disabled={busy}
              onChange={(event) =>
                setDecoy(event.target.value.replace(/\D/g, '').slice(0, 8))
              }
              style={field}
            />
          </label>

          <button
            type="button"
            disabled={busy}
            style={{ ...button, width: '100%', marginTop: '15px' }}
            onClick={saveDecoy}
          >
            {busy ? 'Please wait…' : 'Save decoy PIN'}
          </button>
        </section>

        {motionNeedsPermission() && (
          <section style={card}>
            <h2 style={{ fontSize: '17px', marginTop: 0 }}>
              Motion settings
            </h2>
            <p style={{ color: '#81798f', fontSize: '13px', lineHeight: 1.7 }}>
              Enable motion permission on devices that support shake detection.
            </p>
            <button
              type="button"
              style={button}
              onClick={enableShake}
            >
              Enable shake permission
            </button>
          </section>
        )}

        {msg && (
          <p
            role="status"
            aria-live="polite"
            style={{
              marginTop: '18px',
              padding: '15px',
              border: '1px solid #e4dced',
              borderRadius: '12px',
              background: '#fff',
              color: '#30234c',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            {msg}
          </p>
        )}

        <p
          style={{
            marginTop: '25px',
            fontSize: '12px',
            lineHeight: 1.7,
            color: '#81798f',
          }}
        >
          No app is completely undetectable. Nivara reduces risk, but do not
          rely on it alone in an emergency.
        </p>
      </div>
    </main>
  )
}
