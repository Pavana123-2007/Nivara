// Member 2 – Clues lite: asks the server for single-image clues (nothing is stored).
// Same server address as api.js, kept here so api.js (shared) is not edited.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '') // a stray space, newline or trailing / gives 404s

export async function getClues(fakeFile) {
  const form = new FormData()
  form.append('fake', fakeFile)
  const res = await fetch(`${BASE}/api/clues`, { method: 'POST', body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed (${res.status})`)
  }
  return data
}