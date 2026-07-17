# Speak (codename: gandalf)

A personalized, offline-capable **assistive speech communicator** for people with
dysarthria. It learns how one person says a curated set of phrases, then — when
they speak — says a clear version out loud and shows it on screen. Wrong guesses
are corrected in one tap, and it learns from the correction.

See [`docs/PRD.md`](docs/PRD.md) for the full product spec and architecture.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

> The microphone requires a **secure context**. `localhost` works. To test on a
> phone, serve over HTTPS (e.g. `npm run build && npm run preview` behind a
> tunnel, or deploy — see below). Grant mic permission when prompted.

## How it works (30-second version)

- **Talk mode** — big tap-to-talk button; auto-stops on silence. A confident
  match is spoken automatically; an unsure one shows choices. Every phrase is
  also a big button you can tap directly (voice-first, tap-fallback).
- **Setup mode** — a caregiver records ~3 samples of how the person says each
  phrase, edits the phrase list, and picks the output voice. Optionally PIN-gated.
- Everything (voice samples, phrases, settings) is stored **on-device** in
  IndexedDB and never uploaded.

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production build to `dist/` (generates the PWA service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Oxlint |

## Architecture

```
src/
  config.ts            tuning constants (all calibration in one place)
  types.ts             domain model
  dsp/                 mfcc.ts (Meyda), dtw.ts        — features + matching
  audio/               recorder, capture, resample, endpoint
  recognition/         matcher.ts                     — utterance → ranked phrases + confidence
  speech/              tts.ts                         — Web Speech output
  data/                db.ts (IndexedDB), seed.ts     — evidence-based phrase set
  store/               useStore.ts (zustand)
  hooks/               useRecognizer, useEnroller
  ui/                  screens & components
```

The recognition engine (MFCC + Dynamic Time Warping) is deliberately isolated
behind `recognition/matcher.ts` so it can later be swapped for neural speech
embeddings without touching the UI or data model.

## Deploy (static PWA)

`npm run build` produces a fully static `dist/`. Host it anywhere:

- **Cloudflare Pages:** `npx wrangler pages deploy dist`
- **Vercel / Netlify:** point at the repo; build `npm run build`, output `dist`.

Then text the URL to the first user; on their phone, "Add to Home Screen"
installs it as an offline app.

## Going native later

Wrap this same PWA with **Capacitor** for App Store / Play Store distribution —
no rewrite required.
