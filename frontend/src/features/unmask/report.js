import { jsPDF } from 'jspdf'

const PURPLE = [109, 40, 217]
const MARGIN = 15
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2

// jsPDF can't read WEBP, so every image is redrawn as a JPEG first
async function toJpeg(dataUrl, maxW = 700) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })
  const scale = Math.min(1, maxW / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return { url: canvas.toDataURL('image/jpeg', 0.85), w: canvas.width, h: canvas.height }
}

// Work out an image's size on the page before drawing it
async function prepImage(dataUrl, maxH = 80) {
  const j = await toJpeg(dataUrl)
  let w = CONTENT_W * 0.6
  let h = (w * j.h) / j.w
  if (h > maxH) {
    h = maxH
    w = (h * j.w) / j.h
  }
  return { ...j, pw: w, ph: h }
}

const fmt = (iso) => new Date(iso).toLocaleString('en-IN')

// items: only the vault items she chose to include
// omitted: how many vault items were left out (so the report shows nothing was hidden)
export async function buildEvidenceReport({ name, summary, items, omitted = 0, proof }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  const newPage = () => {
    doc.addPage()
    y = MARGIN
  }
  const ensure = (h) => {
    if (y + h > PAGE_H - 20) newPage()
  }
  const heading = (text, size = 14) => {
    ensure(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(...PURPLE)
    doc.text(text, MARGIN, y)
    doc.setTextColor(0, 0, 0)
    y += size * 0.55
  }
  const para = (text, size = 10, font = 'helvetica') => {
    doc.setFont(font, 'normal')
    doc.setFontSize(size)
    const lineH = size * 0.45
    for (const line of doc.splitTextToSize(text, CONTENT_W)) {
      ensure(lineH)
      doc.text(line, MARGIN, y)
      y += lineH
    }
    y += 2
  }
  const drawImage = (p) => {
    ensure(p.ph + 4)
    doc.addImage(p.url, 'JPEG', MARGIN, y, p.pw, p.ph)
    y += p.ph + 4
  }

  const originalSha = proof?.verdict === 'manipulated' ? proof.original_sha256 : null

  // ---- Cover page ----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(...PURPLE)
  doc.text('Evidence Report', MARGIN, 32)
  doc.setTextColor(0, 0, 0)
  y = 44
  para(`Prepared: ${new Date().toLocaleString('en-IN')}`)
  if (name) para(`Prepared by: ${name}`)
  heading('Summary')
  para(summary || 'No summary written.')
  para(
    `This report contains ${items.length} selected evidence item(s)` +
      `${proof?.verdict === 'manipulated' ? ' and one image manipulation check' : ''}.`,
  )
  if (omitted > 0) {
    para(`${omitted} other item(s) in the vault were not included in this report.`, 9)
  }

  // ---- 1. Saved evidence ----
  if (items.length > 0) {
    newPage()
    heading('1. Saved evidence')
    para('Each item was saved in an encrypted vault on the phone with the time it was saved and a SHA-256 fingerprint.', 9)
    for (const [i, item] of items.entries()) {
      const isOriginal = originalSha && item.sha256 === originalSha
      const title = `Item ${i + 1}: ${item.type}, saved ${fmt(item.created_at)}${isOriginal ? ' (original photo used in the check)' : ''}`
      const pic = item.dataUrl ? await prepImage(item.dataUrl) : null
      // keep the heading, picture and fingerprint together on one page
      ensure(8 + (pic ? pic.ph + 4 : 0) + 8)
      heading(title, 11)
      if (item.text) para(item.text)
      if (pic) drawImage(pic)
      para(`SHA-256: ${item.sha256}`, 8, 'courier')
      y += 2
    }
  }

  // ---- 2. Proof of manipulation ----
  if (proof && proof.verdict === 'manipulated') {
    newPage()
    heading('2. Proof the image was manipulated')
    para(`Result: the image is manipulated. It is ${proof.similarity}% identical to the original photo; the rest was edited.`)
    para(`Checked: ${fmt(proof.checked_at)}`)
    para('The highlighted areas below show what was changed, drawn on the original photo.', 9)
    drawImage(await prepImage(proof.heatmap_png, 100))
    para(`SHA-256 of the fake image: ${proof.fake_sha256}`, 8, 'courier')
    para(`SHA-256 of the original: ${proof.original_sha256}`, 8, 'courier')
    if (items.some((it) => it.sha256 === proof.original_sha256)) {
      para('The original matches a photo saved earlier in the encrypted vault (same fingerprint).', 9)
    }
    if (proof.verifyUrl) para(`Public verification page: ${proof.verifyUrl}`)
  }

  // ---- 3. How to file ----
  newPage()
  heading('3. How to file a complaint')
  para('1. Online: go to cybercrime.gov.in and choose the option to report a crime against women. Attach this PDF and any screenshots.')
  para('2. Write down the acknowledgement number you receive.')
  para('3. By phone: call the national cyber crime helpline 1930.')
  para('4. In person: take this report (printed or on your phone) to your nearest police station. Ask for a copy of your complaint.')
  para('5. If you are in danger right now, call 112.')

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text('Fingerprints (SHA-256) let anyone check these files were not altered.', MARGIN, PAGE_H - 10)
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' })
  }

  doc.save(`Nivara_Evidence_${new Date().toISOString().slice(0, 10)}.pdf`)
}