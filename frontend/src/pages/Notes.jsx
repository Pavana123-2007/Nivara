
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEFAULT = `Groceries
- Milk 1L
- Tomatoes 1 kg
- Rice 5 kg
- Dish soap

To do
- Pay electricity bill
- Call aunty on Sunday
- Return library book`

export default function Notes() {
  const navigate = useNavigate()

  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem('notes') ?? DEFAULT
    } catch {
      return DEFAULT
    }
  })

  useEffect(() => {
    document.title = 'Notes'
    try {
      localStorage.setItem('notes', text)
    } catch {
      // Notes may not persist if storage is blocked.
    }
  }, [text])

  return (
    <main className="min-h-screen bg-yellow-50 p-4 font-sans text-gray-800">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/calc', { replace: true })}
          className="min-h-11 rounded-lg px-4 text-sm text-yellow-800"
        >
          Calculator
        </button>
        <h1 className="font-semibold text-yellow-900">Notes</h1>
        <span className="w-16" aria-hidden="true" />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Notes"
        className="mt-3 h-[80vh] w-full resize-none rounded-lg bg-transparent p-2 text-lg leading-relaxed outline-none"
      />
    </main>
  )
}
