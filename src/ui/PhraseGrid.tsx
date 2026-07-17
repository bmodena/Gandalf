import { useStore } from '../store/useStore';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../types';
import type { Phrase, PhraseCategory } from '../types';

interface Props {
  onSelect: (phrase: Phrase) => void;
  /** Highlight state, e.g. when the grid is acting as a correction picker. */
  correcting?: boolean;
}

export function PhraseGrid({ onSelect, correcting }: Props) {
  const phrases = useStore((s) => s.phrases);

  const byCategory = new Map<PhraseCategory, Phrase[]>();
  for (const phrase of phrases) {
    const list = byCategory.get(phrase.category) ?? [];
    list.push(phrase);
    byCategory.set(phrase.category, list);
  }

  return (
    <div className={`grid ${correcting ? 'correcting' : ''}`}>
      {correcting && <div className="grid-correct-banner">Tap the phrase you meant — it will learn</div>}
      {CATEGORY_ORDER.map((category) => {
        const items = byCategory.get(category);
        if (!items || items.length === 0) return null;
        return (
          <section key={category} className="grid-cat">
            <h3 className="grid-cat-title">{CATEGORY_LABELS[category]}</h3>
            <div className="grid-items">
              {items.map((phrase) => (
                <button
                  key={phrase.id}
                  type="button"
                  className={`phrase-btn cat-${phrase.category}`}
                  onClick={() => onSelect(phrase)}
                >
                  {phrase.text}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
