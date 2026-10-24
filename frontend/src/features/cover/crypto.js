
const enc = new TextEncoder()
const dec = new TextDecoder()

export const ITERATIONS = 310000

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))

// Turns her code + a random salt into an AES-GCM key that cannot be exported
export async function deriveKey(code, salt) {
  const base = await crypto.subtle.importKey(
    'raw',
    enc.encode(code),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptJSON(key, value) {
  const iv = randomBytes(12)

  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(value))
  )

  return { iv, ct }
}

export async function decryptJSON(key, { iv, ct }) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct
  )

  return JSON.parse(dec.decode(pt))
}

export async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? enc.encode(data) : data

  const hash = await crypto.subtle.digest('SHA-256', bytes)

  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
