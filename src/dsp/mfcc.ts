import Meyda from 'meyda';
import { AUDIO, MFCC } from '../config';

/**
 * MFCC feature extraction.
 *
 * We use Meyda (a well-tested browser DSP library) for the FFT → mel filterbank
 * → DCT pipeline rather than hand-rolling it, then frame the signal ourselves so
 * we control the hop size and get a clean time series for DTW.
 */

let configured = false;
function configureMeyda(): void {
  Meyda.bufferSize = AUDIO.frameSize;
  Meyda.sampleRate = AUDIO.sampleRate;
  Meyda.numberOfMFCCCoefficients = MFCC.coefficients;
  Meyda.melBands = MFCC.melBands;
  Meyda.windowingFunction = 'hamming';
  configured = true;
}

/**
 * Extract a sequence of MFCC frames from a mono signal already resampled to
 * {@link AUDIO.sampleRate}. Returns `frames × coefficients`.
 */
export function extractMfccSequence(signal: Float32Array): number[][] {
  if (!configured) configureMeyda();
  const { frameSize, hopSize } = AUDIO;
  const frames: number[][] = [];

  for (let start = 0; start + frameSize <= signal.length; start += hopSize) {
    const frame = signal.subarray(start, start + frameSize);
    const mfcc = Meyda.extract('mfcc', frame) as number[] | null;
    if (mfcc && mfcc.length) frames.push(mfcc);
  }

  if (MFCC.cepstralMeanNormalization) applyCepstralMeanNormalization(frames);
  return frames;
}

/** Subtract each coefficient's mean across the utterance to reduce channel bias. */
function applyCepstralMeanNormalization(frames: number[][]): void {
  if (frames.length === 0) return;
  const dim = frames[0].length;
  const mean = new Array<number>(dim).fill(0);
  for (const f of frames) {
    for (let i = 0; i < dim; i++) mean[i] += f[i];
  }
  for (let i = 0; i < dim; i++) mean[i] /= frames.length;
  for (const f of frames) {
    for (let i = 0; i < dim; i++) f[i] -= mean[i];
  }
}
