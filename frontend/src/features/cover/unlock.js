
import {
  decryptJSON,
  deriveKey,
  encryptJSON,
  randomBytes,
  sha256Hex,
} from './crypto.js'
import { getDB } from './db.js'
import { getSessionKey, setSessionKey } from './session.js'

export const DEFAULT_CODE = '1947'
export const DEFAULT_DECOY = '2580'
const CHECK = 'nivara-ok'

export const isValidCode = (code) => /^\d{4,8}$/.test(code)

async function ensureSetup() {
  const db = await getDB()

  if (!(await db.get('meta', 'salt'))) {
    const salt = randomBytes(16)
    const key = await deriveKey(DEFAULT_CODE, salt)

    await db.put('meta', salt, 'salt')
    await db.put('meta', await encryptJSON(key, CHECK), 'check')
    await db.put('meta', await sha256Hex(DEFAULT_DECOY), 'decoy')
  }

  return db
}

export async function tryUnlock(code) {
  if (!isValidCode(code)) return null

  const db = await ensureSetup()
  const decoyHash = await db.get('meta', 'decoy')

  if ((await sha256Hex(code)) === decoyHash) {
    return 'decoy'
  }

  const salt = await db.get('meta', 'salt')
  const check = await db.get('meta', 'check')
  const key = await deriveKey(code, salt)

  try {
    if ((await decryptJSON(key, check)) === CHECK) {
      setSessionKey(key)
      return 'nivara'
    }
  } catch {
    // Incorrect PIN.
  }

  return null
}

export async function changeCode(newCode) {
  if (!isValidCode(newCode)) {
    throw new Error('PIN must contain 4 to 8 digits.')
  }

  const oldKey = getSessionKey()

  if (!oldKey) {
    throw new Error('Unlock Nivara before changing the PIN.')
  }

  const db = await ensureSetup()
  const decoyHash = await db.get('meta', 'decoy')

  if ((await sha256Hex(newCode)) === decoyHash) {
    throw new Error('Your secret PIN must differ from your decoy PIN.')
  }

  const newSalt = randomBytes(16)
  const newKey = await deriveKey(newCode, newSalt)

  // Re-encrypt vault items before opening the database transaction.
  const encryptedItems = []

  for (const record of await db.getAll('items')) {
    const plain = await decryptJSON(oldKey, record)
    const encrypted = await encryptJSON(newKey, plain)

    encryptedItems.push({
      id: record.id,
      ...encrypted,
    })
  }

  // Read metadata keys correctly; getAll() returns values, not key/value pairs.
  const encryptedSecrets = []

  for (const key of await db.getAllKeys('meta')) {
    if (String(key).startsWith('secret:')) {
      const value = await db.get('meta', key)
      const plain = await decryptJSON(oldKey, value)

      encryptedSecrets.push([
        key,
        await encryptJSON(newKey, plain),
      ])
    }
  }

  const newCheck = await encryptJSON(newKey, CHECK)

  // Commit the encrypted data and new PIN verification together.
  const tx = db.transaction(['items', 'meta'], 'readwrite')
  const itemStore = tx.objectStore('items')
  const metaStore = tx.objectStore('meta')

  for (const item of encryptedItems) {
    itemStore.put(item)
  }

  for (const [key, value] of encryptedSecrets) {
    metaStore.put(value, key)
  }

  metaStore.put(newSalt, 'salt')
  metaStore.put(newCheck, 'check')

  await tx.done

  // Switch the session key only after the database commit succeeds.
  setSessionKey(newKey)
}

export async function setDecoyPin(pin) {
  if (!isValidCode(pin)) {
    throw new Error('Decoy PIN must contain 4 to 8 digits.')
  }

  const db = await ensureSetup()
  const salt = await db.get('meta', 'salt')
  const check = await db.get('meta', 'check')
  const key = await deriveKey(pin, salt)

  let matchesSecret = false

  try {
    matchesSecret = (await decryptJSON(key, check)) === CHECK
  } catch {
    // This PIN does not match the secret PIN.
  }

  if (matchesSecret) {
    throw new Error('Your decoy PIN must differ from your secret PIN.')
  }

  await db.put('meta', await sha256Hex(pin), 'decoy')
}
