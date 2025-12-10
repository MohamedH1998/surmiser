import type { SurmiserProvider, SuggestionContext, Suggestion } from '../types';
import { normalizeText, tokenize } from './tokenizer';
import { defaultCorpus } from './default-corpus';

export function localPredictive(
  phrases: string[] = defaultCorpus
): SurmiserProvider {
  const processedPhrases = phrases.map(p => ({
    text: normalizeText(p),
    tokens: tokenize(p),
  }));

  return {
    id: 'local-predictive',
    priority: 10,

    async suggest(ctx: SuggestionContext): Promise<Suggestion | null> {
      const textBeforeCursor = ctx.text.slice(0, ctx.cursorPosition);
      const input = normalizeText(textBeforeCursor);
      if (!input) return null;

      // Allowed: apostrophes ('), hyphens (-), commas (,), spaces
      if (/[.!?;:…@#$%^&*()+=[\]{}|\\/<>`~]$/.test(textBeforeCursor.trim())) {
        return null;
      }

      const inputForMatching = input.replace(/[,''-]\s*$/, '').trim();
      if (!inputForMatching) return null;

      const inputTokens = tokenize(inputForMatching);
      if (inputTokens.length === 0) return null;

      const isMidWord =
        textBeforeCursor.length > 0 && !/\s$/.test(textBeforeCursor);

      let bestMatch: {
        text: string;
        confidence: number;
        matchLen: number;
      } | null = null;

      for (let matchLen = inputTokens.length; matchLen >= 1; matchLen--) {
        const inputPrefix = inputTokens.slice(-matchLen);
        const inputLastToken = inputPrefix[matchLen - 1];
        let foundMatchAtThisLevel = false;

        for (const { tokens: phraseTokens } of processedPhrases) {
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

            const confidence = matchLen >= 3 ? 95 : matchLen >= 2 ? 90 : 80;

            // Update best match if this is better (longer match or first found)
            if (
              suggestionText &&
              (!bestMatch || matchLen > bestMatch.matchLen)
            ) {
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
    },
  };
}
