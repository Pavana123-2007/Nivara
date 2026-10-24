const mods = import.meta.glob('../cover/vault.js')

const DEMO_ITEMS = [
  {
    id: 'demo_1',
    type: 'note',
    created_at: '2026-10-20T21:14:00Z',
    sha256: 'demo-0000000000000000000000000000000000000000000000000000000000000001',
    mime: 'text/plain',
    dataUrl: null,
    text: 'DEMO: Message received: "Leave, and everyone sees your pictures."',
  },
  {
    id: 'demo_2',
    type: 'note',
    created_at: '2026-10-22T23:02:00Z',
    sha256: 'demo-0000000000000000000000000000000000000000000000000000000000000002',
    mime: 'text/plain',
    dataUrl: null,
    text: 'DEMO: He took my phone again and read my messages.',
  },
]

export async function loadVaultItems() {
  const loader = mods['../cover/vault.js']
  if (!loader) return { items: DEMO_ITEMS, demo: true }
  const mod = await loader()
  return { items: await mod.exportVault(), demo: false }
}