
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '') // a stray space, newline or trailing / gives 404s

async function handle(res) {
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data?.error || {
      code: 'network',
      message: `Request failed (${res.status})`,
    }
    throw Object.assign(new Error(err.message), {
      code: err.code,
      status: res.status,
    })
  }

  return data
}

export async function health() {
  return handle(await fetch(`${BASE}/api/health`))
}

// Member 2
export async function compareImages(fakeFile, originalFile) {
  const form = new FormData()
  form.append('fake', fakeFile)
  form.append('original', originalFile)

  return handle(
    await fetch(`${BASE}/api/compare`, {
      method: 'POST',
      body: form,
    }),
  )
}

// Member 2
export async function getVerification(id) {
  return handle(
    await fetch(`${BASE}/api/verify/${encodeURIComponent(id)}`),
  )
}

// Member 1
export async function sendAlert({
  chatId,
  name = null,
  lat = null,
  lng = null,
}) {
  return handle(
    await fetch(`${BASE}/api/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        name,
        lat,
        lng,
      }),
    }),
  )
}

// Stretch (Member 1)
export async function safeShareMark(imageFile, recipientIds) {
  const form = new FormData()
  form.append('image', imageFile)
  form.append('recipients', JSON.stringify(recipientIds))

  return handle(
    await fetch(`${BASE}/api/safeshare/mark`, {
      method: 'POST',
      body: form,
    }),
  )
}

// Stretch (Member 2)
export async function safeShareScan(imageFile) {
  const form = new FormData()
  form.append('image', imageFile)

  return handle(
    await fetch(`${BASE}/api/safeshare/scan`, {
      method: 'POST',
      body: form,
    }),
  )
}
