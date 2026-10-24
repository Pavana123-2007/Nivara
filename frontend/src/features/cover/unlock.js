
import { decryptJSON, deriveKey, encryptJSON, randomBytes, sha256Hex } from './crypto.js'
import { getDB } from './db.js'
import { getSessionKey, setSessionKey } from './session.js'

export const DEFAULT_CODE = '1947'
export const DEFAULT_DECOY = '2580'
const CHECK = 'nivara-ok'

export const isValidCode = (c) => /^\d{4,8}$/.test(c)

// First run: set up the vault with the default code
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

// Returns 'nivara', 'decoy' or null
export async function tryUnlock(code) {
  const db = await ensureSetup()

  if ((await sha256Hex(code)) === (await db.get('meta', 'decoy'))) {
    return 'decoy'
  }

  const key = await deriveKey(code, await db.get('meta', 'salt'))

  try {
    if ((await decryptJSON(key, await db.get('meta', 'check'))) === CHECK) {
      setSessionKey(key)
      return 'nivara'
    }
  } catch {
    // Wrong code: decryption fails
  }

  return null
}

// Re-lock everything with a new code
export async function changeCode(newCode) {
  const oldKey = getSessionKey()
  const db = await ensureSetup()

  if (!oldKey) {
    throw new Error('Unlock Nivara before changing the code.')
  }

  if ((await sha256Hex(newCode)) === (await db.get('meta', 'decoy'))) {
    throw new Error('Your new Nivara code must be different from your decoy PIN.')
  }

  const newSalt = randomBytes(16)
  const newKey = await deriveKey(newCode, newSalt)

  const items = []
  for (const rec of await db.getAll('items')) {
    items.push({
      id: rec.id,
      rec: await encryptJSON(newKey, await decryptJSON(oldKey, rec)),
    })
  }

  const secrets = []
  for (const [k, v] of await db.getAll('meta')) {
    if (String(k).startsWith('secret:')) {
      secrets.push([
        k,
        await encryptJSON(newKey, await decryptJSON(oldKey, v)),
      ])
    }
  }

  const check = await encryptJSON(newKey, CHECK)

  const tx = db.transaction(['items', 'meta'], 'readwrite')
  const itemStore = tx.objectStore('items')
  const metaStore = tx.objectStore('meta')

  for (const item of items) {
    await itemStore.put({ id: item.id, ...item.rec })
  }

  for (const [k, v] of secrets) {
    await metaStore.put(v, k)
  }

  await metaStore.put(newSalt, 'salt')
  await metaStore.put(check, 'check')
  await tx.done

  setSessionKey(newKey)
}

export async function setDecoyPin(pin) {
  const db = await ensureSetup()

  let same = false
  try {
    const key = await deriveKey(pin, await db.get('meta', 'salt'))
    same = (await decryptJSON(key, await db.get('meta', 'check'))) === CHECK
  } catch {
    same = false
  }

  if (same) {
    throw new Error('Your decoy PIN must be different from your code.')
  }

  await db.put('meta', await sha256Hex(pin), 'decoy')
}
