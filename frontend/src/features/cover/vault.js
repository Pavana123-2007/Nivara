
import { decryptJSON, encryptJSON, sha256Hex } from './crypto.js'
import { getDB } from './db.js'
import { getSessionKey } from './session.js'

function requireKey() {
  const key = getSessionKey()
  if (!key) throw new Error('Nivara is locked')
  return key
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

async function store(item) {
  const id = `v_${crypto.randomUUID()}`
  const db = await getDB()

  await db.put('items', {
    id,
    ...(await encryptJSON(requireKey(), item)),
  })

  return { id, ...item }
}

export async function addFile(file, type = 'photo') {
  requireKey()

  return store({
    type,
    created_at: new Date().toISOString(),
    sha256: await sha256Hex(await file.arrayBuffer()),
    mime: file.type || 'application/octet-stream',
    dataUrl: await readAsDataURL(file),
    text: null,
  })
}

export async function addNote(text) {
  requireKey()

  return store({
    type: 'note',
    created_at: new Date().toISOString(),
    sha256: await sha256Hex(text),
    mime: 'text/plain',
    dataUrl: null,
    text,
  })
}

export async function listItems() {
  const key = requireKey()
  const db = await getDB()
  const items = []

  for (const rec of await db.getAll('items')) {
    items.push({
      id: rec.id,
      ...(await decryptJSON(key, rec)),
    })
  }

  return items.sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
}

export async function deleteItem(id) {
  requireKey()
  const db = await getDB()
  await db.delete('items', id)
}

export async function exportVault() {
  return listItems()
}

export async function saveSecret(name, value) {
  const db = await getDB()
  await db.put(
    'meta',
    await encryptJSON(requireKey(), value),
    `secret:${name}`,
  )
}

export async function loadSecret(name) {
  const db = await getDB()
  const rec = await db.get('meta', `secret:${name}`)
  return rec ? decryptJSON(requireKey(), rec) : null
}
