import type { LocalProvider, SuggestionContext, Suggestion } from '../types';
import { normalizeText, tokenize } from './tokenizer';
import { defaultCorpus } from './default-corpus';

const MAX_DISCARD = 1;
const CONTEXT_WINDOW = 6;

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}

function getSegmentTokens(
  allTokens: string[],
  segmentStartIndex: number
): { tokens: string[]; isPunctReset: boolean } {
  let isPunctReset = false;

  const lastPunctIndex = findLastIndex(allTokens, t =>
    /[.!?]/.test(t.slice(-1))
  );

  let segment: string[];
  if (lastPunctIndex !== -1) {
    segment = allTokens.slice(lastPunctIndex + 1);
    isPunctReset = true;
  } else {
    segment = allTokens.slice(segmentStartIndex);
  }

  if (segment.length > CONTEXT_WINDOW) {
    segment = segment.slice(-CONTEXT_WINDOW);
  }

  return { tokens: segment, isPunctReset };
}

class LocalPredictiveProvider implements LocalProvider {
  id = 'local-predictive';
  priority = 10;
  private segmentStartIndex = 0;
  private processedPhrases: Array<{ text: string; tokens: string[] }>;

  constructor(phrases: string[] = defaultCorpus) {
    this.processedPhrases = phrases.map(p => ({
      text: normalizeText(p),
      tokens: tokenize(p),
    }));
  }

  markSegmentBoundary(tokenCount: number): void {
    this.segmentStartIndex = tokenCount;
  }

  async suggest(ctx: SuggestionContext): Promise<Suggestion | null> {
    const textBeforeCursor = ctx.text.slice(0, ctx.cursorPosition);
    const input = normalizeText(textBeforeCursor);
    if (!input) return null;

    const allTokens = tokenize(input);
    if (allTokens.length === 0) return null;

    const { tokens: segmentTokens, isPunctReset } = getSegmentTokens(
      allTokens,
      this.segmentStartIndex
    );
    if (segmentTokens.length === 0) return null;

    const isFreshInput =
      this.segmentStartIndex === 0 && segmentTokens.length === allTokens.length;

    if (segmentTokens.length === 1 && !isFreshInput && !isPunctReset) {
      return null;
    }

    const isMidWord =
      textBeforeCursor.length > 0 && !/\s$/.test(textBeforeCursor);

    let bestMatch: {
      text: string;
      confidence: number;
      matchLen: number;
    } | null = null;

    for (let matchLen = segmentTokens.length; matchLen >= 1; matchLen--) {
      const discarded = segmentTokens.length - matchLen;

      if (discarded > MAX_DISCARD) continue;

      if (matchLen === 1 && segmentTokens.length > 1) {
        continue;
      }

      if (matchLen === 1) {
        const lastToken = segmentTokens[segmentTokens.length - 1];
        if (lastToken.length < 2) {
          continue;
        }
      }

      const inputPrefix = segmentTokens.slice(-matchLen);
      const inputLastToken = inputPrefix[matchLen - 1];
      let foundMatchAtThisLevel = false;
      for (const { tokens: phraseTokens } of this.processedPhrases) {
        if (phraseTokens.length < matchLen) continue;

        let isMatch = true;
        for (let i = 0; i < matchLen - 1; i++) {
          if (phraseTokens[i] !== inputPrefix[i]) {
            isMatch = false;
            break;
          }
        }
        if (!isMatch) continue;

        const phraseLastToken = phraseTokens[matchLen - 1];

        if (isMidWord) {
          if (!phraseLastToken.startsWith(inputLastToken)) {
            isMatch = false;
          }
        } else {
          if (phraseLastToken !== inputLastToken) {
            isMatch = false;
          }
        }

        if (isMatch) {
          foundMatchAtThisLevel = true;

          let suggestionText = '';

          if (isMidWord) {
            suggestionText += phraseLastToken.slice(inputLastToken.length);
          }

          const remainingTokens = phraseTokens.slice(matchLen);
          if (remainingTokens.length > 0) {
            const remainingText = remainingTokens.join(' ');
            if (suggestionText) {
              suggestionText += ' ' + remainingText;
            } else if (isMidWord) {
              suggestionText = ' ' + remainingText;
            } else {
              suggestionText = remainingText;
            }
          }

          const confidence = matchLen >= 3 ? 85 : matchLen >= 2 ? 80 : 75;

          if (suggestionText && (!bestMatch || matchLen > bestMatch.matchLen)) {
            bestMatch = { text: suggestionText, confidence, matchLen };
          }
        }
      }

      if (foundMatchAtThisLevel) {
        break;
      }
    }

    if (bestMatch) {
      return {
        text: bestMatch.text,
        confidence: bestMatch.confidence,
        providerId: 'local-predictive',
      };
    }

    return null;
  }
}

export function localPredictive(
  phrases: string[] = defaultCorpus
): LocalProvider {
  return new LocalPredictiveProvider(phrases);
}
