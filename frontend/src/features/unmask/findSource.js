// Member 2 – Find source
// Finds which vault photo a fake was made from.
// Runs entirely on the phone: vault photos never leave the device.

const SIZE = 32
const CROPS = [1, 0.9, 0.8] // also try zoomed-in versions, in case the fake was cropped
export const MATCH_THRESHOLD = 0.75

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = src
  })
}

// Tiny blurred grey thumbnail, centred and scaled so photos of any brightness compare fairly
function signature(img, crop = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const sw = img.naturalWidth * crop
  const sh = img.naturalHeight * crop
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) / 2
  ctx.filter = 'blur(1px)'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE)
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

  const v = new Float32Array(SIZE * SIZE)
  let mean = 0
  for (let i = 0; i < v.length; i++) {
    v[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    mean += v[i]
  }
  mean /= v.length
  let norm = 0
  for (let i = 0; i < v.length; i++) {
    v[i] -= mean
    norm += v[i] * v[i]
  }
  norm = Math.sqrt(norm) || 1
  for (let i = 0; i < v.length; i++) v[i] /= norm
  return v
}

// 1 = identical, 0 = unrelated
function similarity(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

function isPhoto(item) {
  return Boolean(item?.dataUrl) && (item.mime || '').startsWith('image/')
}

// Returns { match, best, checked }
//   match:   the vault item it was made from (or null if nothing is close enough)
//   best:    the closest item and its score, even if below the threshold (useful for testing)
//   checked: how many vault photos were compared
export async function findSource(fakeFile, vaultItems) {
  const fakeUrl = URL.createObjectURL(fakeFile)
  let fakeSig
  try {
    fakeSig = signature(await loadImage(fakeUrl))
  } finally {
    URL.revokeObjectURL(fakeUrl)
  }

  const photos = vaultItems.filter(isPhoto)
  let best = null
  for (const item of photos) {
    try {
      const img = await loadImage(item.dataUrl)
      const score = Math.max(...CROPS.map((c) => similarity(fakeSig, signature(img, c))))
      if (!best || score > best.score) best = { item, score }
    } catch {
      // skip a photo that can't be read
    }
  }

  return {
    match: best && best.score >= MATCH_THRESHOLD ? best : null,
    best,
    checked: photos.length,
  }
}

// Turns a vault photo back into a file, so it can go to the normal compare
export async function itemToFile(item) {
  const blob = await (await fetch(item.dataUrl)).blob()
  const type = blob.type || item.mime || 'image/jpeg'
  const ext = type.split('/')[1] || 'jpg'
  return new File([blob], `vault-original.${ext}`, { type })
}