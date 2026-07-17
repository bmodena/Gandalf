import { AUDIO, ENDPOINT } from '../config';
import { extractMfccSequence } from '../dsp/mfcc';
import { durationMs, trimSilence } from './endpoint';
import { Recorder } from './recorder';
import { resampleLinear } from './resample';

export interface CapturedUtterance {
  /** MFCC feature sequence (empty when tooShort). */
  mfcc: number[][];
  /** The trimmed, voiced signal at {@link sampleRate} — kept so it can be saved as WAV. */
  audio: Float32Array;
  sampleRate: number;
  durationMs: number;
  tooShort: boolean;
}

/**
 * Record one utterance end-to-end: capture → downsample → trim silence →
 * MFCC, while also returning the raw voiced audio. Shared by live recognition
 * and enrollment so both use an identical front end.
 *
 * @param onLevel   receives 0–1 level updates for UI metering
 * @param bindRecorder  hands the live Recorder to the caller so it can stop early
 */
export async function captureUtterance(
  onLevel?: (level: number) => void,
  bindRecorder?: (recorder: Recorder) => void,
): Promise<CapturedUtterance> {
  const recorder = new Recorder();
  if (onLevel) recorder.onLevel = onLevel;
  bindRecorder?.(recorder);

  await recorder.start();
  const { samples, sampleRate } = await recorder.done;

  const mono16k = resampleLinear(samples, sampleRate, AUDIO.sampleRate);
  const voiced = trimSilence(mono16k);
  const ms = durationMs(voiced, AUDIO.sampleRate);
  const tooShort = ms < ENDPOINT.minVoicedMs;

  return {
    mfcc: tooShort ? [] : extractMfccSequence(voiced),
    audio: voiced,
    sampleRate: AUDIO.sampleRate,
    durationMs: ms,
    tooShort,
  };
}
