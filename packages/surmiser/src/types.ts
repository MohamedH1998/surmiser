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

export interface RemoteProviderConfig {
  id: string;
  priority?: number;
  endpoint: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface RemoteSuggestionResponse {
  suggestion: string;
  confidence: number; // 0-100 scale (matches local provider)
}

export interface LocalProvider {
  id: string;
  priority?: number;
  suggest(
    ctx: SuggestionContext,
    signal: AbortSignal
  ): Promise<Suggestion | null>;
  markSegmentBoundary?: (tokenCount: number) => void;
}

export type SurmiserProvider = LocalProvider | RemoteProviderConfig;

export interface SurmiserOptions {
  providers?: SurmiserProvider | SurmiserProvider[];
  corpus?: string[];
  debounceMs?: number;
  minConfidence?: number;
  onSuggestion?: (s: Suggestion | null) => void;
  onAccept?: (s: Suggestion) => void;
}
