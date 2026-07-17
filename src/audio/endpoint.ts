import { AUDIO, ENDPOINT } from '../config';

/**
 * Trim leading/trailing silence using short-time RMS energy relative to the
 * utterance peak. Returns the voiced region (or the original if it's all quiet).
 * A little context padding is kept on each side.
 */
export function trimSilence(signal: Float32Array): Float32Array {
  const win = AUDIO.hopSize;
  const rms: number[] = [];
  for (let i = 0; i + win <= signal.length; i += win) {
    let s = 0;
    for (let j = 0; j < win; j++) {
      const v = signal[i + j];
      s += v * v;
    }
    rms.push(Math.sqrt(s / win));
  }
  if (rms.length === 0) return signal;

  const peak = Math.max(...rms);
  if (peak === 0) return signal;
  const threshold = peak * ENDPOINT.silenceThreshold;

  let startFrame = 0;
  while (startFrame < rms.length && rms[startFrame] < threshold) startFrame++;
  let endFrame = rms.length - 1;
  while (endFrame > startFrame && rms[endFrame] < threshold) endFrame--;
  if (startFrame >= endFrame) return signal;

  const pad = 2;
  const start = Math.max(0, (startFrame - pad) * win);
  const end = Math.min(signal.length, (endFrame + 1 + pad) * win);
  return signal.subarray(start, end);
}

export function durationMs(signal: Float32Array, sampleRate: number): number {
  return (signal.length / sampleRate) * 1000;
}
