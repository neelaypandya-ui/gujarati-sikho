# ગુજરાતી શીખો — Learn Gujarati

A mobile-installable PWA that teaches children Gujarati through flashcards, quizzes, conversations, and real audio pronunciation. Runs 100% on free tiers.

---

## Free Tier Budget

| Service | Free Allowance | Your Usage |
|---------|---------------|------------|
| **Netlify Hosting** | 100 GB bandwidth/mo | ~50 KB per page load |
| **Netlify Functions** | 125,000 invocations/mo | 1 per speaker-button tap |
| **Google Cloud TTS — Standard** | 4,000,000 chars/mo | ~5 chars per word ("નમસ્તે") |
| **Google Cloud TTS — WaveNet** | 1,000,000 chars/mo | Same — better quality |

At ~5 chars per tap, you get **800,000 audio plays/mo on Standard** or **200,000 on WaveNet** before hitting any limit. The app also caches audio client-side so repeated taps on the same word cost zero.

---

## Deploy in 10 Minutes

### Step 1: Get a Google Cloud TTS API Key (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "Gujarati App")
3. Go to **APIs & Services → Library** → search **"Cloud Text-to-Speech API"** → click **Enable**
4. Go to **APIs & Services → Credentials** → **Create Credentials → API Key**
5. Copy the key
6. **(Recommended)** Click the key → **Restrict key** → select only "Cloud Text-to-Speech API"

### Step 2: Deploy to Netlify

**Option A — Git deploy (recommended)**

```bash
# Push this folder to a GitHub/GitLab repo, then:
# 1. Go to app.netlify.com → "Add new site" → "Import from Git"
# 2. Select your repo
# 3. Build settings are auto-detected from netlify.toml:
#      Build command: npm run build
#      Publish directory: dist
# 4. Click "Deploy site"
```

**Option B — CLI deploy**

```bash
npm install
npm run build
npx netlify-cli deploy --prod --dir=dist
```

### Step 3: Add Your API Key to Netlify

1. Go to your site in [app.netlify.com](https://app.netlify.com)
2. **Site configuration → Environment variables**
3. Add: `GOOGLE_TTS_API_KEY` = *(paste your key)*
4. **Deploys → Trigger deploy → Deploy site** (redeploy to pick up the env var)

### Step 4: Install on Your Phone

1. Open your Netlify URL on your phone's browser
2. **Android Chrome:** tap "Add to Home Screen" (or the install banner)
3. **iPhone Safari:** tap Share → "Add to Home Screen"

The app installs with its own icon, launches fullscreen, and works offline (except audio which needs network).

---

## How the Audio Works

```
Phone → tap 🔈 → POST /api/tts → Netlify Function → Google Cloud TTS → audio back
                                    (API key hidden here)
```

Your Google API key is stored as a Netlify environment variable and never sent to the browser. The serverless function:
- Only allows `gu-IN` Gujarati voices
- Only allows Standard + WaveNet (free tier voices)
- Caps text at 200 characters per request
- Returns audio as base64 MP3
- Sets `Cache-Control: 24h` to reduce repeat calls
- The client also caches audio in-memory so tapping the same word twice costs zero API calls

---

## Local Development

```bash
# Install
npm install

# Run (frontend only — audio won't work without the function)
npm run dev

# Run with Netlify Functions locally
npx netlify-cli dev
# → opens http://localhost:8888 with working audio
# → requires GOOGLE_TTS_API_KEY in a .env file:
echo "GOOGLE_TTS_API_KEY=your-key-here" > .env
```

---

## Project Structure

```
gujarati-app/
├── index.html                 # Entry HTML with PWA meta tags
├── package.json               # Dependencies (React + Vite + PWA plugin)
├── vite.config.js             # Build config + PWA manifest + service worker
├── netlify.toml               # Netlify build & deploy settings
├── public/
│   └── favicon.svg            # App icon (ગુ on orange)
├── src/
│   ├── main.jsx               # React entry point
│   └── App.jsx                # Entire app (single file, ~700 lines)
└── netlify/
    └── functions/
        └── tts.mjs            # Serverless TTS proxy (keeps API key hidden)
```

No backend servers. No databases. No paid services. Just static files + one serverless function.

---

## What's In the App

- **70+ Gujarati words** across 8 categories (Greetings, Family, Numbers, Colors, Animals, Food, Body, Actions)
- **Flip-card flashcards** with Gujarati script, romanization, phonetic pronunciation, and tips
- **10 common sentences** with pronunciation breakdowns
- **3 conversation scenarios** with line-by-line reveal (Meeting Someone, Dinner Table, Playing Outside)
- **Quizzes** per category with star ratings
- **40 Gujarati letters** pronunciation guide with audio for each letter
- **4 voice options**: Standard Female/Male (free), WaveNet Female/Male (free, better quality)
- **Adjustable speed**: 0.5x–1.2x (default 0.8x for kids)
- **Progress tracking** with streak counter (saved in localStorage)
- **PWA installable** — works as a "real app" on both Android and iPhone

---

## Voice Options

| Voice | Quality | Free Tier |
|-------|---------|-----------|
| Standard Female (gu-IN-Standard-A) | Good | 4M chars/mo |
| Standard Male (gu-IN-Standard-B) | Good | 4M chars/mo |
| WaveNet Female (gu-IN-Wavenet-A) | Better — more natural | 1M chars/mo |
| WaveNet Male (gu-IN-Wavenet-B) | Better — more natural | 1M chars/mo |

Default is Standard Female. Switch in Settings (🔊 button in header).

---

## Customization

**Add words:** Edit the `CATEGORIES` object in `src/App.jsx`:
```js
{ gujarati: "તારો", roman: "Taaro", english: "Star", pronunciation: "TAA-roh", tip: "..." }
```

**Add conversations:** Append to the `CONVERSATIONS` array.

**Change theme:** Search `#E8734A` and replace globally.

**Change icon:** Replace `public/favicon.svg`.
