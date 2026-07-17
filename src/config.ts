/**
 * Central tuning constants for the recognition pipeline.
 *
 * Everything that might need calibration lives here so the DSP can be tuned
 * (or later swapped for a neural embedding model) without hunting through the
 * codebase. Values marked "per-user" also have a Trainer-mode override.
 */

export const AUDIO = {
  /** Target sample rate for feature extraction (Hz). Speech is well covered at 16k. */
  sampleRate: 16_000,
  /** Analysis frame size in samples. Must be a power of two for Meyda. 512 @16k ≈ 32ms. */
  frameSize: 512,
  /** Hop between successive frames in samples. 256 @16k ≈ 16ms (50% overlap). */
  hopSize: 256,
} as const;

export const MFCC = {
  /** Cepstral coefficients kept per frame. */
  coefficients: 13,
  /** Mel filterbank bands. */
  melBands: 26,
  /** Subtract the per-coefficient mean across the utterance (channel normalization). */
  cepstralMeanNormalization: true,
} as const;

export const ENDPOINT = {
  /** Per-frame RMS (relative to the utterance peak) below which a frame is "silence". */
  silenceThreshold: 0.08,
  /** Absolute RMS gate used for live voice-activity detection during recording. */
  vadGate: 0.015,
  /** Trailing silence (ms) after speech that auto-stops a recording. */
  trailingSilenceMs: 900,
  /** Hard cap on recording length (ms). */
  maxRecordingMs: 6_000,
  /** Minimum voiced duration (ms) for a recording to count as a real utterance. */
  minVoicedMs: 250,
} as const;

export const MATCH = {
  /**
   * Default normalized DTW distance below which a match may auto-speak.
   * Lower = stricter. Overridable per profile (settings.acceptDistance).
   */
  acceptDistance: 55,
  /**
   * Required relative gap between best and second-best candidate to auto-speak.
   * Prevents confidently voicing the wrong phrase when two are nearly tied.
   */
  minMarginRatio: 0.12,
  /** How many candidates to surface when confidence is low. */
  candidateCount: 3,
} as const;

/** Recommended number of enrollment samples per phrase (kept low for fatigue). */
export const ENROLL_TARGET_SAMPLES = 3;
