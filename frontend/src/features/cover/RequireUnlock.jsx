import { useEffect } from 'react'
import { isUnlocked, vanish } from './session.js'
import { useShake } from './useShake.js'
import { useI18n } from '../../i18n.jsx'
import { Link, Navigate, Outlet } from 'react-router-dom'

const IDLE_MS = 2 * 60 * 1000 // no touches for 2 minutes
const AWAY_MS = 30 * 1000 // left the app for 30 seconds

function LockedArea() {
  const { t } = useI18n()
  useShake(vanish)

  useEffect(() => {
    let idle = setTimeout(vanish, IDLE_MS)
    let hiddenAt = null
    const reset = () => {
      clearTimeout(idle)
      idle = setTimeout(vanish, IDLE_MS)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS) vanish()
      else hiddenAt = null
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(idle)
      events.forEach((ev) => window.removeEventListener(ev, reset))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
  <>
    <Outlet />
    <Link
      to="/nivara/help"
      className="fixed left-4 bottom-4 z-50 flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-gray-900 shadow-lg"
    >
      {t('tool.help')}
    </Link>
    <button
      onClick={vanish}
      aria-label="Hide Nivara now"
      className="fixed right-4 bottom-4 z-50 min-h-12 rounded-full bg-gray-900 px-6 text-sm font-medium text-white shadow-lg"
    >
      {t('common.hide')}
    </button>
  </>
  )
}

export default function RequireUnlock() {
  return isUnlocked() ? <LockedArea /> : <Navigate to="/calc" replace />
}