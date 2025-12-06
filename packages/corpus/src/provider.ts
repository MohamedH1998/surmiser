import type {
  SurmiseProvider,
  SuggestionContext,
  Suggestion,
} from "@surmise/core";
import { normalizeText, tokenize } from "./tokenizer";
import { defaultCorpus } from "./default-corpus";

export function localPredictive(phrases: string[] = defaultCorpus): SurmiseProvider {
  const normalizedPhrases = phrases.map((p) => normalizeText(p));

  return {
    id: "local-predictive",
    priority: 10,

    async suggest(ctx: SuggestionContext): Promise<Suggestion | null> {
      const textBeforeCursor = ctx.text.slice(0, ctx.cursorPosition);
      const hasTrailingSpace = /\s$/.test(textBeforeCursor);
      const input = normalizeText(textBeforeCursor);
      if (!input) return null;

      // Terminal punctuation and special characters no suggestions after these
      // Allowed: apostrophes ('), hyphens (-), commas (,), spaces
      if (/[.!?;:…@#$%^&*()+=\[\]{}|\\/<>`~]$/.test(textBeforeCursor.trim())) {
        return null;
      }

      // Strip trailing commas for matching
      const inputForMatching = input.replace(/,\s*$/, "").trim();
      if (!inputForMatching) return null;

      // Check if we're mid-word
      const isMidWord =
        textBeforeCursor.length > 0 && !/\s$/.test(textBeforeCursor);

      if (isMidWord) {
        // Find phrases that start with input
        let bestMatch: { phrase: string; score: number } | null = null;

        for (const phrase of normalizedPhrases) {
          if (
            phrase.startsWith(inputForMatching) &&
            phrase.length > inputForMatching.length
          ) {
            const score = input.length; // longer match = better
            if (!bestMatch || score > bestMatch.score) {
              bestMatch = { phrase, score };
            }
          }
        }

        if (bestMatch) {
          return {
            text: bestMatch.phrase.slice(inputForMatching.length),
            confidence: 85,
            providerId: "local-predictive",
          };
        }
      }

      const inputTokens = tokenize(inputForMatching);
      if (inputTokens.length === 0) return null;

      let bestMatch: {
        text: string;
        confidence: number;
        matchLen: number;
      } | null = null;

      for (let matchLen = inputTokens.length; matchLen >= 1; matchLen--) {
        // Only match single tokens if input is single token
        if (matchLen === 1 && inputTokens.length > 1) {
          continue;
        }
        const prefix = inputTokens.slice(-matchLen);
        for (const phrase of normalizedPhrases) {
          const phraseTokens = tokenize(phrase);

          const phrasePrefix = phraseTokens.slice(0, matchLen).join(" ");
          const inputPrefix = prefix.join(" ");

          if (phrasePrefix === inputPrefix && phraseTokens.length > matchLen) {
            const remainingTokens = phraseTokens.slice(matchLen);

            const suggestion = hasTrailingSpace ? remainingTokens.join(" ") : " " + remainingTokens.join(" ");
            const confidence = matchLen >= 3 ? 95 : matchLen >= 2 ? 90 : 80;

            // Keep best match (prefer longer matches)
            if (!bestMatch || matchLen > bestMatch.matchLen) {
              bestMatch = { text: suggestion, confidence, matchLen };
            }
          }
        }

        // Return best match for this matchLen before trying shorter
        if (bestMatch) {
          return {
            text: bestMatch.text,
            confidence: bestMatch.confidence,
            providerId: "local-predictive",
          };
        }
      }

      return null;
    },
  };
}
