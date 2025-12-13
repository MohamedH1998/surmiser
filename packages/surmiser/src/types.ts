export interface SuggestionContext {
  inputValue: string;
  cursorPosition: number;
  lastTokens: string[];
}

export interface Suggestion {
  completion: string;
  confidence: number; // 0-1 scale
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
  confidence: number; // 0-1 scale
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
