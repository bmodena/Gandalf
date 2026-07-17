/**
 * Linear resampling.
 *
 * Browser AudioContexts usually run at 44.1k or 48k; we downsample to the 16k
 * the feature extractor expects. Linear interpolation is adequate for speech
 * MFCCs; a polyphase/anti-alias filter is a future refinement.
 */
export function resampleLinear(
  input: Float32Array,
  inRate: number,
  outRate: number,
): Float32Array {
  if (inRate === outRate || input.length === 0) return input;
  const ratio = outRate / inRate;
  const outLength = Math.max(1, Math.round(input.length * ratio));
  const output = new Float32Array(outLength);

  for (let i = 0; i < outLength; i++) {
    const srcPos = i / ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = srcPos - i0;
    output[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return output;
}
