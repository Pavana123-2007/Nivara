
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tryUnlock } from '../features/cover/unlock.js'

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '\u00D7': (a, b) => a * b,
  '\u00F7': (a, b) => (b === 0 ? NaN : a / b),
}

const LABELS = {
  '-': 'minus',
  '\u00D7': 'times',
  '\u00F7': 'divide',
  '+': 'plus',
  '%': 'percent',
  AC: 'clear',
}

const format = (n) =>
  Number.isFinite(n) ? String(parseFloat(n.toPrecision(12))) : 'Error'

const START = { display: '0', stored: null, op: null, fresh: true, code: '' }

const ROWS = [
  ['AC', '\u00B1', '%', '\u00F7'],
  ['7', '8', '9', '\u00D7'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

export default function Calc() {
  const navigate = useNavigate()
  const [s, setS] = useState(START)
  const [busy, setBusy] = useState(false)

  const digit = (d) => {
    setS((p) => {
      if (p.display === 'Error') p = START
      const display =
        p.fresh || p.display === '0'
          ? d
          : p.display.length < 12
            ? p.display + d
            : p.display

      return {
        ...p,
        display,
        fresh: false,
        code: p.code === null ? null : p.code + d,
      }
    })
  }

  const dot = () => {
    setS((p) => {
      const base = p.fresh || p.display === 'Error' ? '0' : p.display
      return {
        ...p,
        display: base.includes('.') ? base : `${base}.`,
        fresh: false,
        code: null,
      }
    })
  }

  const operator = (op) => {
    setS((p) => {
      if (p.display === 'Error') return START
      const cur = parseFloat(p.display)
      if (p.op && !p.fresh) {
        const r = OPS[p.op](p.stored, cur)
        const ok = Number.isFinite(r)
        return {
          display: format(r),
          stored: ok ? r : null,
          op: ok ? op : null,
          fresh: true,
          code: null,
        }
      }
      return { ...p, stored: cur, op, fresh: true, code: null }
    })
  }

  const sign = () => {
    setS((p) =>
      p.display === '0' || p.display === 'Error'
        ? p
        : { ...p, display: format(-parseFloat(p.display)), code: null },
    )
  }

  const percent = () => {
    setS((p) =>
      p.display === 'Error'
        ? p
        : { ...p, display: format(parseFloat(p.display) / 100), code: null },
    )
  }

  async function equals() {
    if (busy) return

    if (!s.op && s.code && /^\d{4,8}$/.test(s.code)) {
      setBusy(true)
      try {
        const result = await tryUnlock(s.code)

        if (result === 'nivara') {
          navigate('/nivara', { replace: true })
          return
        }

        if (result === 'decoy') {
          navigate('/notes', { replace: true })
          return
        }
      } finally {
        setBusy(false)
      }
    }

    setS((p) => {
      if (!p.op || p.display === 'Error') return { ...p, fresh: true, code: '' }

      const r = OPS[p.op](p.stored, parseFloat(p.display))
      return {
        display: format(r),
        stored: null,
        op: null,
        fresh: true,
        code: null,
      }
    })
  }

  function press(k) {
    if (/^\d$/.test(k)) return digit(k)
    if (k === '.') return dot()
    if (k === 'AC') return setS(START)
    if (k === '\u00B1') return sign()
    if (k === '%') return percent()
    if (k === '=') return equals()
    return operator(k)
  }

  const keyStyle = (k) => {
    if (['AC', '\u00B1', '%'].includes(k)) return 'bg-gray-300 text-black'
    if (k in OPS) return 'bg-calc-op text-white'
    return 'bg-calc-key text-white'
  }

  const size = s.display.length > 9 ? 'text-5xl' : 'text-7xl'

  return (
    <main className="flex min-h-screen flex-col justify-end bg-calc-bg p-4 select-none text-white">
      <output
        aria-live="polite"
        className={`mb-4 block truncate px-2 text-right font-light ${size}`}
      >
        {s.display}
      </output>

      <div className="grid grid-cols-4 gap-3">
        {ROWS.flat().map((k, i) => {
          const button = k === '0' ? 'col-span-2' : ''

          return (
            <button
              key={`${k}-${i}`}
              onClick={() => press(k)}
              aria-label={LABELS[k] || k}
              disabled={busy}
              className={`rounded-full py-5 text-3xl active:opacity-70 ${keyStyle(k)} ${button}`}
            >
              {k}
            </button>
          )
        })}
      </div>
    </main>
  )
}

