import { useState } from 'react'
import { LanguageToggle, useI18n } from '../i18n.jsx'
import { Page } from '../ui.jsx'
import {
  changeCode,
  setDecoyPin,
  isValidCode,
} from '../features/cover/unlock.js'
import {
  motionNeedsPermission,
  requestMotionPermission,
} from '../features/cover/useShake.js'

function PinInput({ label, placeholder, value, onChange, disabled }) {
  return (
    <label className="ui-label">
      {label}
      <input
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 8))}
        className="ui-input"
      />
    </label>
  )
}

export default function Settings() {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [code2, setCode2] = useState('')
  const [decoy, setDecoy] = useState('')
  // msg = { key, vars, kind }: shown with t() so it follows the language
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const say = (key, kind = 'info', vars) => setMsg({ key, kind, vars })

  async function saveCode() {
    if (busy) return

    setMsg(null)

    if (!isValidCode(code)) return say('settings.badPin', 'error')
    if (code !== code2) return say('settings.mismatch', 'error')
    if (code === decoy) return say('settings.sameAsDecoy', 'error')

    setBusy(true)
    say('settings.savingPin')

    try {
      await changeCode(code)
      setCode('')
      setCode2('')
      say('settings.pinChanged', 'ok')
    } catch (error) {
      console.error('Failed to change secret PIN:', error)
      say('settings.pinFailed', 'error', { error: error?.message || '' })
    } finally {
      setBusy(false)
    }
  }

  async function saveDecoy() {
    if (busy) return

    setMsg(null)

    if (!isValidCode(decoy)) return say('settings.badDecoy', 'error')

    setBusy(true)
    say('settings.savingDecoy')

    try {
      await setDecoyPin(decoy)
      setDecoy('')
      say('settings.decoySaved', 'ok')
    } catch (error) {
      console.error('Failed to save decoy PIN:', error)
      say('settings.decoyFailed', 'error', { error: error?.message || '' })
    } finally {
      setBusy(false)
    }
  }

  async function enableShake() {
    try {
      const granted = await requestMotionPermission()
      say(granted ? 'settings.motionOk' : 'settings.motionNo', granted ? 'ok' : 'error')
    } catch {
      say('settings.motionErr', 'error')
    }
  }

  return (
    <Page title={t('tool.settings')} intro={t('settings.intro')}>
      <div className="ui-stack">
        <section className="ui-card">
          <h2 className="ui-h2">{t('common.language')}</h2>
          <LanguageToggle />
        </section>

        <section className="ui-card ui-stack">
          <div>
            <h2 className="ui-h2">{t('settings.pinTitle')}</h2>
            <p className="ui-muted">{t('settings.pinHint')}</p>
          </div>
          <PinInput label={t('settings.newPin')} placeholder={t('settings.newPinPh')} value={code} onChange={setCode} disabled={busy} />
          <PinInput label={t('settings.confirmPin')} placeholder={t('settings.confirmPh')} value={code2} onChange={setCode2} disabled={busy} />
          <button type="button" disabled={busy} className="ui-btn" onClick={saveCode}>
            {busy ? t('settings.wait') : t('settings.pinTitle')}
          </button>
        </section>

        <section className="ui-card ui-stack">
          <div>
            <h2 className="ui-h2">{t('settings.decoyTitle')}</h2>
            <p className="ui-muted">{t('settings.decoyHint')}</p>
          </div>
          <PinInput label={t('settings.newDecoy')} placeholder={t('settings.decoyPh')} value={decoy} onChange={setDecoy} disabled={busy} />
          <button type="button" disabled={busy} className="ui-btn" onClick={saveDecoy}>
            {busy ? t('settings.wait') : t('settings.saveDecoy')}
          </button>
        </section>

        {motionNeedsPermission() && (
          <section className="ui-card ui-stack">
            <div>
              <h2 className="ui-h2">{t('settings.motionTitle')}</h2>
              <p className="ui-muted">{t('settings.motionHint')}</p>
            </div>
            <button type="button" className="ui-btn ui-btn-soft" onClick={enableShake}>
              {t('settings.motionBtn')}
            </button>
          </section>
        )}

        {msg && (
          <p
            role={msg.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`ui-msg ${msg.kind === 'error' ? 'ui-msg-error' : msg.kind === 'ok' ? 'ui-msg-ok' : 'ui-msg-info'}`}
            style={{ overflowWrap: 'anywhere' }}
          >
            {t(msg.key, msg.vars)}
          </p>
        )}

        <p className="ui-small">{t('settings.disclaimer')}</p>
      </div>
    </Page>
  )
}
