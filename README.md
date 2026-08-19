# Rythu360 🌾 — MVP

A 360° farming assistant: crop planning risk, price/profit estimate, disease
photo check, and a farm diary. Built with **Expo (React Native)** so you can
run it free and test it directly on your own phone.

## What's already built (Version 1 MVP)

- 🌱 **Crop Plan** — enter land, budget, crop → get a risk/profit estimate
- 📸 **Disease Check** — upload a photo (real AI model not wired up yet — see below)
- 💰 **Profit Calculator** — quick investment vs. revenue calculator
- 📔 **Farm Diary** — log crop cycles (currently in-memory, resets on reload)

All screens use the Rythu360 color palette in `constants/colors.js`.

## 1. Install prerequisites (one-time, free)

1. **Node.js** — [nodejs.org](https://nodejs.org), install the LTS version
2. **Expo Go app** on your phone — free, from Play Store / App Store
   (search "Expo Go")
3. **VS Code** — [code.visualstudio.com](https://code.visualstudio.com) (optional but recommended)

## 2. Run it on your own phone (free, no app store account needed)

Open a terminal in this folder and run:

```bash
npm install
npx expo start
```

A QR code will appear in the terminal. Open the **Expo Go** app on your
phone and scan it — the app loads live on your phone. Any time you edit a
file and save, the app on your phone updates automatically.

## 3. Project structure

```
rythu360/
  App.js                  # navigation + tab bar setup
  app.json                # app name, icon, package id
  constants/colors.js     # brand color palette
  screens/
    HomeScreen.js
    CropPlanScreen.js
    DiseaseCheckScreen.js
    ProfitCalculatorScreen.js
    FarmDiaryScreen.js
```

## 4. What's placeholder vs. real right now

| Feature | Current state | Next step |
|---|---|---|
| Crop risk/profit numbers | Simple formula, made-up assumptions | Replace `estimateRisk()` in `CropPlanScreen.js` with a real API call once you have a price-prediction backend |
| Disease detection | Fake "62% confidence, ask an expert" result | Wire up an actual image-classification model/API |
| Farm Diary | In-memory only (resets on app reload) | Connect Supabase (see below) so entries persist |

## 5. Free backend/database — Supabase

When you're ready to save real data (farmer profiles, diary entries, disease
photos):

1. Go to [supabase.com](https://supabase.com) → sign up free
2. Create a new project → free tier gives you ~500MB Postgres + auth + file storage
3. Copy your Project URL and anon key from Settings → API
4. `npm install @supabase/supabase-js`
5. Create `utils/supabase.js`:

```js
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient("YOUR_PROJECT_URL", "YOUR_ANON_KEY");
```

## 6. Other free tools you'll want later

| Need | Free option |
|---|---|
| Weather data | [OpenWeatherMap](https://openweathermap.org/api) free tier (1,000 calls/day) |
| Maps | Google Maps (free $200/month credit) or OpenStreetMap |
| Telugu voice (speech-to-text/text-to-speech) | Google Cloud / Azure — free monthly quota, then pay-per-use |
| Push notifications | Firebase Cloud Messaging — free |
| Market price data | [Agmarknet](https://agmarknet.gov.in) government API — free, rate-limited |

## 7. Publishing later (not needed yet)

- Testing on your own phone via Expo Go: **free, unlimited**
- Google Play Store listing: **$25 one-time**
- Apple App Store listing: **$99/year** (only if you want iOS)

Until you're ready to publish, everything above is ₹0 to build and test.

## 8. Suggested next build order

1. Get this running on your phone (today)
2. Replace the placeholder crop-risk formula with real mandi price data
3. Connect Supabase so Farm Diary entries persist
4. Add farmer login (phone number OTP via Firebase Auth — free tier)
5. Wire up a real disease-detection model
6. Add Telugu voice input/output
7. Marketplace (only after the advisory features are proven useful — and only
   with licensed/authorized sellers, since pesticide sales are regulated in India)
