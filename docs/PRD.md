# Speak — Product Requirements Document (MVP)

**Codename:** gandalf
**Status:** MVP-0 built (this repo)
**Last updated:** 2026-07-17
**Owner:** Brian (TMBR)

---

## 1. Problem

People with **dysarthria** — muddy, slurred, or gurgled speech caused by stroke,
ALS, cerebral palsy, TBI, or similar — can still vocalize, but strangers, family,
and voice assistants often can't understand them. General-purpose speech
recognition (Siri, Whisper, Google) is trained on typical speech and performs
poorly for exactly this population, which is why they're underserved.

## 2. What we're building

A **personalized, offline-capable assistive communicator**. It learns how *one
specific person* says a curated set of high-frequency phrases, and when they
speak, it outputs a clear version — **spoken aloud** through the device speaker
and **shown on screen**. When it guesses wrong, the person or caregiver corrects
it, and the correction feeds back in so accuracy improves with use ("self-healing").

It is, in effect, **voice-driven AAC** (augmentative & alternative communication):
the job of a communication board, driven by the user's own voice instead of
buttons — with a tap-based board as a fallback.

## 3. Users & roles

| Role | Who | Needs |
|------|-----|-------|
| **Speaker** | The person with dysarthria (first user: dysarthria + motor impairment + fatigue, **no aphasia** — comprehension intact) | Giant tap targets, one-handed use, tap-to-talk, clean text output, never gets "stuck" |
| **Trainer / Caregiver** | A family member | Simple setup, record samples, manage phrases, pick voice, review corrections |

Roles are a **local mode switch** (Talk vs Setup), Setup optionally PIN-gated. No
cloud login in MVP.

## 4. Goals / Non-goals

**Goals (MVP)**
- Prove the core loop: record → recognize → speak → correct → learn.
- Work as a **link you can text to the first user today** (PWA), installable and
  **offline-capable**.
- Local-first: voice data never leaves the device.
- Evidence-based starter phrase set; caregiver can tailor it.
- Confidence-gated speaking + fast correction (safety).

**Non-goals (for now)**
- Open-vocabulary transcription of arbitrary novel sentences.
- Cloud accounts / cross-device sync.
- Voice banking (speaking in the person's *own* voice).
- Native App Store / Play Store distribution (Capacitor comes later).
- Multi-language (English first).

## 5. Product decisions (locked)

| Area | Decision | Why |
|------|----------|-----|
| Delivery | **PWA** (React + Vite + TS) | Shareable by link now; installable + offline later; covers any form factor |
| Recognition engine | **On-device**; MFCC + Dynamic Time Warping now, neural embeddings later | Few-shot, speaker-dependent, offline, no GPU; correction = add a template |
| Vocabulary | **Closed set + slot-filling** (slots post-MVP) | General ASR fails on dysarthric speech; closed set is accurate with little data |
| Data | **Local-first** (IndexedDB + service worker) | Privacy of voice/health data; offline |
| Trigger | **Tap-to-talk**, auto-stop on silence | Safe, private, no false triggers, low motor demand |
| Speak behavior | **Confidence-gated** (auto-speak when sure; confirm when not) | Balance speed vs. the risk of voicing the wrong thing |
| UI model | **Voice-first + tap-fallback board** | Never leaves the user stuck; board doubles as the correction input |
| Output voice | Built-in OS voice, selectable | Offline, no downloads |
| Native later | **Capacitor** wraps the PWA | No rewrite; better native mic/audio if needed |

## 6. Recognition pipeline

```
Mic (getUserMedia)
  → PCM capture + live VAD + silence auto-stop      [audio/recorder.ts]
  → downsample to 16 kHz                            [audio/resample.ts]
  → trim leading/trailing silence                   [audio/endpoint.ts]
  → MFCC feature sequence (Meyda) + CMN             [dsp/mfcc.ts]
  → DTW match vs. each phrase's templates           [dsp/dtw.ts, recognition/matcher.ts]
  → rank + confidence (absolute distance + margin)
  → high → auto-speak (TTS); low → show choices; none → retry
  → correction adds the utterance as a new template [self-heal, no retraining]
```

**Confidence gating.** A phrase's score is its nearest template's normalized DTW
distance. `high` requires both a close absolute match *and* a clear margin over
the runner-up; only `high` auto-speaks. This is a **safety** mechanism: a
confident wrong spoken output ("I'm fine" vs "I'm in pain") is worse than asking.

**Upgrade path.** The engine is isolated behind `matcher.ts` + `dsp/`. Swapping
MFCC/DTW for neural speech embeddings (wav2vec2/HuBERT via transformers.js/ONNX)
+ nearest-neighbor requires no UI or data-model changes.

## 7. Data model (IndexedDB, on-device)

- **profiles** — name, consent timestamp, settings (voice, rate, pitch, accept
  distance, alwaysConfirm, PIN).
- **phrases** — text, spokenText (expandable), category, order.
- **templates** — `phraseId`, MFCC sequence, duration, source (`enroll` |
  `correction`). This is the personalization; it stays on the device.

## 8. Seed phrase set (evidence-based)

Grounded in AAC **core-vocabulary** research (~200 high-frequency words cover
~80% of communication) and proven **hospital/ICU communication-board** content
(pain, needs, feelings, requests for people, yes/no, social). Categories:
Responses, Needs, Requests, Feelings, Social — ~32 phrases, caregiver-editable.
See `src/data/seed.ts`.

## 9. Safety, privacy, consent

- **Safety:** confidence gating, optional always-confirm, one-tap correction,
  and the tap-fallback board (never stuck).
- **Privacy:** all audio/features stay in IndexedDB on the device; nothing is
  uploaded. Stated plainly on the consent screen.
- **Consent:** first-run screen; caregiver confirms permission to record the
  person's voice. Recorded (timestamped) on the profile.

## 10. Roadmap

- **MVP-0 (done):** core loop, seed phrases, enrollment, Talk/Setup, consent,
  PWA/offline, tap-fallback, self-heal. Local single profile.
- **MVP-1:** real-device QA & threshold calibration; per-sample review/delete;
  export/import a profile (backup + move between devices); nicer enrollment
  guidance for fatigue; optional reinforce-on-confirm.
- **MVP-2:** slot-filling templates ("I want ___"); usage history/favorites;
  neural-embedding engine option; per-phrase confidence tuning.
- **Later:** Capacitor native build (store distribution); optional encrypted
  cloud sync; voice banking; multi-profile management.

## 11. Open questions

- Threshold defaults will need calibration against a real dysarthric voice.
- Optimal enrollment sample count vs. fatigue (start at 3).
- Whether to reinforce templates on every confirmed correct guess (risk: bloat).
- Hosting target (Cloudflare Pages / Vercel / Netlify — all fit a static PWA).
