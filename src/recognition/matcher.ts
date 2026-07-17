import { MATCH } from '../config';
import { dtwDistance } from '../dsp/dtw';
import type { Candidate, MatchResult, Phrase, Template } from '../types';

export interface PhraseTemplates {
  phrase: Phrase;
  templates: Template[];
}

/**
 * Match an utterance's MFCC sequence against the enrolled phrase library.
 *
 * Each phrase scores as its *best* (nearest) template distance. Candidates are
 * ranked best-first, and a confidence level is derived from both the absolute
 * distance (is anything actually close?) and the margin to the runner-up (is it
 * unambiguous?). This is what drives confidence-gated speaking: only a `high`
 * result auto-speaks; `low` surfaces choices; `none` asks the user to retry.
 */
export function matchUtterance(
  mfcc: number[][],
  library: PhraseTemplates[],
  acceptDistance: number,
): MatchResult {
  const scored: Candidate[] = [];
  for (const { phrase, templates } of library) {
    if (templates.length === 0) continue;
    let best = Infinity;
    for (const template of templates) {
      const distance = dtwDistance(mfcc, template.mfcc);
      if (distance < best) best = distance;
    }
    scored.push({ phrase, distance: best });
  }
  scored.sort((a, b) => a.distance - b.distance);

  const candidates = scored.slice(0, Math.max(MATCH.candidateCount, 3));
  const best = scored[0] ?? null;
  const second = scored[1];

  let confidence: MatchResult['confidence'] = 'none';
  let marginRatio = 0;

  if (best && Number.isFinite(best.distance)) {
    marginRatio =
      second && Number.isFinite(second.distance) && second.distance > 0
        ? (second.distance - best.distance) / second.distance
        : 1;

    if (best.distance <= acceptDistance && marginRatio >= MATCH.minMarginRatio) {
      confidence = 'high';
    } else if (best.distance <= acceptDistance * 1.6) {
      confidence = 'low';
    }
  }

  return { candidates, best, confidence, marginRatio };
}
