export interface SuggestionContext {
  text: string;
  cursorPosition: number;
  lastTokens: string[];
}

export interface Suggestion {
  text: string;
  confidence: number;
  providerId: string;
}

export interface SurmiserProvider {
  id: string;
  priority: number;
  suggest(
    ctx: SuggestionContext,
    signal: AbortSignal
  ): Promise<Suggestion | null>;
  markSegmentBoundary?: (tokenCount: number) => void;
}

export interface SurmiserOptions {
  providers?: SurmiserProvider[];
  corpus?: string[];
  debounceMs?: number;
  minConfidence?: number;
  onSuggestion?: (s: Suggestion | null) => void;
  onAccept?: (s: Suggestion) => void;
}
