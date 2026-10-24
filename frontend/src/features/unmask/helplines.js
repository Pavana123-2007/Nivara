// Check every entry against an official source, then set verified: true
export const HELPLINES = [
  { number: '112', name: 'Emergency (police, ambulance)', note: 'If you are in danger right now', verified: true },
  { number: '181', name: 'Women Helpline', note: 'Support and advice for women', verified: true },
  { number: '1930', name: 'National Cyber Crime Helpline', note: 'Report online crimes', verified: true },
  { number: '14490', name: 'National Commission for Women helpline', note: 'Complaints to NCW', verified: true },
]

export const LINKS = [
  { name: 'Report online at cybercrime.gov.in', url: 'https://cybercrime.gov.in/', verified: true },
  { name: 'StopNCII: help stop intimate images spreading', url: 'https://stopncii.org/', verified: true },
]

// Where each platform's help / report pages start. Verify, and swap in the direct report form if you find it.
export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', url: 'https://help.instagram.com/' },
  { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/help/' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://faq.whatsapp.com/' },
  { id: 'x', name: 'X (Twitter)', url: 'https://help.x.com/' },
  { id: 'youtube', name: 'YouTube', url: 'https://support.google.com/youtube/' },
  { id: 'telegram', name: 'Telegram', url: 'https://telegram.org/support' },
  { id: 'other', name: 'Other website', url: null },
]

// Verified: IT Amendment Rules 2026, G.S.R. 120(E), in force 20 Feb 2026
export const LEGAL_REFERENCE =
  "Rule 3(2)(b) of India's Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, as amended by the IT Amendment Rules, 2026 (G.S.R. 120(E), in force 20 February 2026)"