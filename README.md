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

## Training corpus (Cloudflare D1 + R2)

Samples are stored **local-first** (IndexedDB) and uploaded in the background to a
private corpus when online: audio WAVs go to the R2 bucket `gandalf-audio`, and
labeled metadata to the D1 database `gandalf-samples`. The ingest API is
`functions/api/samples.ts` (a Pages Function), gated by an `INGEST_TOKEN` the app
sends as `x-ingest-token`. Reading the corpus is **not** exposed to the app — only
the admin export below, which uses your `wrangler` login.

**Export everything for training:**

```bash
npm run export:corpus                 # -> ./corpus-export/
npm run export:corpus -- --profile <profileId>   # just one voice
npm run export:corpus -- --no-audio   # labels only, skip WAV download
```

Produces `labels.jsonl` + `labels.csv` and `audio/<profileId>/<phraseId>/<id>.wav`.

**Quick end-to-end write test** (needs the ingest token you set):

```bash
printf 'test' > /tmp/t.wav
curl -X POST https://gandalf-1ly.pages.dev/api/samples \
  -H "x-ingest-token: <YOUR_TOKEN>" \
  -F "audio=@/tmp/t.wav" \
  -F 'meta={"id":"test-1","profileId":"test","phraseId":"test","phraseText":"test"}'
# then: npm run export:corpus   (you should see the test row + WAV)
```

## Going native later

Wrap this same PWA with **Capacitor** for App Store / Play Store distribution —
no rewrite required.
