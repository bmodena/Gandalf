/**
 * Dynamic Time Warping between two MFCC sequences.
 *
 * DTW aligns two variable-length feature sequences by warping the time axis, so
 * it is robust to the natural speed variation in how a person says the same
 * phrase twice. The accumulated cost is normalized by the warping-path length,
 * which keeps the score largely invariant to utterance duration.
 *
 * Implemented with two rolling rows for O(m) memory.
 */
export function dtwDistance(a: number[][], b: number[][]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return Infinity;

  let prevCost = new Float64Array(m + 1).fill(Infinity);
  let currCost = new Float64Array(m + 1).fill(Infinity);
  // Track path length alongside cost so we can length-normalize the result.
  let prevSteps = new Float64Array(m + 1);
  let currSteps = new Float64Array(m + 1);
  prevCost[0] = 0;

  for (let i = 1; i <= n; i++) {
    currCost.fill(Infinity);
    currCost[0] = Infinity;
    for (let j = 1; j <= m; j++) {
      const cost = euclidean(a[i - 1], b[j - 1]);

      // Three predecessors: insertion, match (diagonal), deletion.
      let best = prevCost[j];
      let bestSteps = prevSteps[j];
      if (prevCost[j - 1] < best) {
        best = prevCost[j - 1];
        bestSteps = prevSteps[j - 1];
      }
      if (currCost[j - 1] < best) {
        best = currCost[j - 1];
        bestSteps = currSteps[j - 1];
      }

      currCost[j] = best + cost;
      currSteps[j] = bestSteps + 1;
    }
    [prevCost, currCost] = [currCost, prevCost];
    [prevSteps, currSteps] = [currSteps, prevSteps];
  }

  const total = prevCost[m];
  const steps = prevSteps[m] || 1;
  return total / steps;
}

function euclidean(x: number[], y: number[]): number {
  let sum = 0;
  const d = Math.min(x.length, y.length);
  for (let i = 0; i < d; i++) {
    const diff = x[i] - y[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
