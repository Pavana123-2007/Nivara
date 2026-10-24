import { useState } from 'react'

export default function BlurReveal({ src, alt }) {
  const [shown, setShown] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setShown((s) => !s)}
      className="relative block w-full overflow-hidden rounded-card"
      aria-label={shown ? `Hide ${alt}` : `Show ${alt}`}
    >
      <img src={src} alt={alt} className={`w-full transition ${shown ? '' : 'scale-105 blur-xl'}`} />
      {!shown && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-medium text-white">
          Tap to show
        </span>
      )}
    </button>
  )
}