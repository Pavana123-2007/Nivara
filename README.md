# Nivara

**For when the danger is someone who has your phone and your photos.**

Nivara is a women's-safety web app hidden inside a working calculator. It is built for the situation most safety apps ignore: the person threatening her is someone close, who checks her phone and uses her photos (often morphed) as threats.

Team **HackHers**, recHERsion'26, Problem Statement 2: Women's Safety
Pavana G · Pavani Kanipakam

- **Live demo:** https://calc-app-hh.vercel.app (open it, do a sum, then type `1947 =`)
- **Demo video:** https://drive.google.com/file/d/1faMV5ijD0-rvOy_PY545Sm0zYqJTXASi/view?usp=sharing
  Please **download the video and then watch it**. Google Drive's online preview can be low quality or still processing for large videos.
- **Alert bot:** https://t.me/parcel_updates_hh24_bot (tap **Start** before testing alerts; steps below)
- **Backend API:** hosted on Render (free plan; the first request after a quiet period can take about a minute while it wakes up)

---

## What it does

| Step | Feature |
|---|---|
| **Hide** | A real, working calculator. Only her secret code (`1947 =`) opens Nivara. Shake the phone or tap **Hide** and it vanishes; it also locks itself after inactivity. A decoy code opens harmless notes. |
| **Collect** | An evidence vault for photos and notes. Everything is encrypted on her phone (AES-GCM, key derived from her code), timestamped and fingerprinted (SHA-256). Nothing is stored in her gallery. |
| **Prove** | Upload the fake and her original: Nivara lines them up (ORB + homography), compares them (SSIM) and highlights exactly what was changed. **Only have the fake?** Nivara searches her vault on the phone, finds the original it was made from, and runs the comparison automatically. If no original is found, it checks the file for **AI labels** (Content Credentials / C2PA, e.g. "Made with ChatGPT") and other metadata, shown clearly as *clues, not proof*. |
| **Alert** | Tapping a harmless phrase ("Can you pick up the parcel?") sends a real alert, optionally with location, to one trusted contact through a Telegram bot. |
| **Act** | One tap makes an evidence report PDF (chosen vault items, the proof, fingerprints, how to file a complaint) and a takedown complaint citing the 2-hour removal rule, plus verified helplines (1930, 112, 181). |
| **Restore** | A public **verify link** that anyone (a platform, the police, family) can open to confirm the image was manipulated, showing only a blurred thumbnail and the fingerprint, never her original. |
| **Safe Share** | Each person she sends a photo to gets a copy with an invisible mark; if one leaks, Nivara can show whose copy it was. (Works best on uncompressed copies; heavy WhatsApp compression can destroy the mark.) |

### Privacy by design
- **No accounts, no login, no names.** Evidence lives encrypted on her own phone; only her code opens it.
- **The vault search runs on the phone.** Only the single photo she compares is sent to the server, and it is never stored.
- Verify links contain no personal data: verdict, similarity, a blurred thumbnail and the SHA-256 fingerprint.
- Installs as a PWA named **"Calculator"**, with no app-store history.

### Tested accuracy
`backend/tests/robustness.py` runs 3 real photo pairs through JPEG compression (q90/70/50), resizing, cropping, WhatsApp-like and screenshot-like copies:

**Caught 23 of 24 edited fakes; 0 false alarms on 6 untouched originals.**
Results: `backend/tests/results/robustness.md`

---

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS v4, React Router, PWA (vite-plugin-pwa) |
| On-phone security | Web Crypto (AES-GCM, SHA-256), IndexedDB |
| Report | jsPDF (generated on the phone) |
| Backend | Python, FastAPI, Uvicorn |
| Image forensics | OpenCV (ORB alignment), scikit-image (SSIM), NumPy, Pillow |
| Watermark | invisible-watermark (DWT-DCT), PyWavelets |
| Alerts | Telegram Bot API |
| Hosting | Vercel (frontend), Render (backend, Docker) |

All free and open source.

## Dependencies

**System:** Git · Node.js 20+ · Python 3.10+

**Backend (Python)**: full list in [`backend/requirements.txt`](backend/requirements.txt):
`fastapi`, `uvicorn[standard]`, `python-multipart`, `python-dotenv`, `httpx`, `opencv-python-headless`, `scikit-image`, `numpy`, `Pillow`, `PyWavelets`, plus `invisible-watermark` (installed separately with `--no-deps`, see setup).

**Frontend (Node)**: full list in [`frontend/package.json`](frontend/package.json):
`react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `vite-plugin-pwa`, `idb`, `jspdf`.

**Services (optional):** a Telegram bot token (free, from @BotFather) for alerts.

---

## Project structure

```
Nivara/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routes
│   │   ├── imaging.py           # alignment + SSIM comparison + heatmap
│   │   ├── clues.py             # AI-label / metadata clues (no original)
│   │   ├── storage.py           # verify-link records
│   │   ├── imwatermark_safe.py  # loads invisible-watermark without torch
│   │   └── routes/              # compare, clues, verify, alert, safeshare
│   ├── tests/robustness.py      # accuracy test
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Calc, Nivara home, Notes, Settings, Verify
│   │   ├── features/cover/      # Hide, vault, alert, lock, Safe Share (send)
│   │   └── features/unmask/     # Prove, Find source, Clues, report, takedown, help, Safe Share (scan)
│   ├── package.json
│   └── .env.example
└── samples/public/              # harmless test photo pairs (camel, flower, room)
```

---

## Run it locally

### Requirements
- Git
- Node.js 20 or newer
- Python 3.10 or newer

### 1. Clone
```bash
git clone https://github.com/Pavana123-2007/Nivara.git
cd Nivara
```

### 2. Backend (terminal 1)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
pip install --no-deps invisible-watermark
```
Create `backend/.env` from the example and fill in your values:
```bash
# Windows:
copy .env.example .env
# macOS / Linux:
cp .env.example .env
```
- **Telegram bot token**: needed only for alerts. Create a bot with @BotFather and paste its token into `.env`.
- `ALLOWED_ORIGINS` (optional): comma-separated frontend addresses allowed to call the API. Defaults to `http://localhost:5173`.

Start the API:
```bash
uvicorn app.main:app --reload
```
Check it: http://localhost:8000/api/health should return `{"status":"ok"}`. API docs: http://localhost:8000/docs

### 3. Frontend (terminal 2)
```bash
cd frontend
npm install
# Windows:
copy .env.example .env
# macOS / Linux:
cp .env.example .env
npm run dev
```
`frontend/.env` contains `VITE_API_URL=http://localhost:8000`.

Open http://localhost:5173

### 4. Try it
1. Do a normal sum on the calculator, then type `1947 =` to open Nivara.
2. **Evidence vault:** save `samples/public/camel_original.jpg`.
3. **Prove it's fake:** choose `camel_fake.jpg` and tap **"I only have the fake – find the original in my vault"**. You'll get a FAKE result with the edit highlighted.
4. Try `room_fake.jpg` (original not in the vault): the Clues card shows its AI label ("Made with ChatGPT").
5. **Evidence report** and **Takedown complaint** buttons appear under the result.
6. **Send alert:** see *Try the Telegram alert yourself* below.
7. **Hide:** tap **Hide** (or shake the phone) and Nivara turns back into the calculator. The decoy code `2580 =` opens harmless notes instead.
8. **Safe Share:** choose a photo, type two names, **Make marked copies**, and download one copy. Then open **Who leaked this photo?** on the same device and choose that copy: Nivara shows whose copy it was.

### Try the Telegram alert yourself (judges)
You can receive a real Nivara alert on your own phone in about 1 minute:

1. **Start our bot:** open https://t.me/parcel_updates_hh24_bot in Telegram and tap **Start**.
   (Telegram only lets a bot message people who have started it first, so this step is required.)
2. **Get your chat ID:** in Telegram, open **@userinfobot** and tap **Start**. It replies with `Id: 123456789`; that number is your chat ID.
3. **Add yourself as the trusted contact:** on the live site, type `1947 =` → **Send alert** → enter any name and your chat ID (numbers only, not your @username) → **Save trusted contact**.
4. **Send the alert:** tap **"Can you pick up the parcel?"** (optionally tick *Also share my location*). Within a few seconds the bot sends you the real alert.

If it says the alert could not be delivered: make sure you tapped **Start** on the bot above, used the **numeric** chat ID, and haven't blocked the bot.

### 5. Accuracy test
```bash
cd backend
python tests/robustness.py
```

---

## Deploy

**Backend: Render (free Web Service)**
- Root directory: `backend`, runtime: **Docker**, branch: `main`
- Environment variables: the Telegram bot token (same name as in `.env.example`) and
  `ALLOWED_ORIGINS=https://<your-vercel-site>,http://localhost:5173`

**Frontend: Vercel**
- Root directory: `frontend`
- Environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com` (no slash at the end)

---

## Honest limitations
- **Proof needs her original photo**, either uploaded or already saved in her Nivara vault, where Nivara finds it automatically from the fake alone. If no original exists anywhere, Nivara gives clues (AI labels, metadata), never a verdict. WhatsApp, Instagram and screenshots strip AI labels, so "no label" never means "real".
- Telegram bots can only message people who have tapped **Start** on the bot first, so the trusted contact must start the bot once.
- The vault lives on her phone: clearing browser data or losing the phone loses it (encrypted backup is future work).
- Safe Share marks may not survive heavy compression or editing.
- Render's free plan sleeps when idle; the first request can take about a minute.

## What's next
Hindi/Kannada voice · cyber-cell partnerships · video deepfakes · pixel-level forensics for photos with no original · more robust Safe Share leak tracing

## Legal reference
Rule 3(2)(b), Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, as amended by the IT Amendment Rules, 2026 (G.S.R. 120(E), in force 20 February 2026): platforms must remove morphed or non-consensual intimate images within 2 hours of a complaint.

If you are in danger in India, call **112**. Cyber crime helpline: **1930** · cybercrime.gov.in
