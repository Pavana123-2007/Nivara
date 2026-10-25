// Safe Share: recipient names stay encrypted on this phone; only the 4-character ids go to the server.
import { loadSecret, saveSecret } from './vault.js'

const SECRET = 'safeshare'
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789' // agreed with Member 2: 4 lowercase letters/digits

async function loadAll() {
  return (await loadSecret(SECRET)) || {}
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return [...bytes].map((b) => CHARS[b % CHARS.length]).join('')
}

// n new ids, unique among themselves and among ids already saved
export async function newRecipientIds(n) {
  const taken = new Set(Object.keys(await loadAll()))
  const ids = []
  while (ids.length < n) {
    const id = randomId()
    if (!taken.has(id)) {
      taken.add(id)
      ids.push(id)
    }
  }
  return ids
}

// pairs: [{ id, name }]
export async function saveRecipients(pairs) {
  const all = await loadAll()
  for (const { id, name } of pairs) all[id] = { name, sent_at: new Date().toISOString() }
  await saveSecret(SECRET, all)
}

// Used by Member 2's SafeShareScan to show who a leaked copy was sent to
export async function getRecipientName(id) {
  return (await loadAll())[id]?.name ?? null
}
