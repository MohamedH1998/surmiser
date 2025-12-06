// Core types - will implement in Phase 2
export interface SuggestionContext {
  text: string
  cursorPosition: number
  lastTokens: string[]
}

export interface Suggestion {
  text: string
  confidence: number
  providerId: string
}

export interface ClozeProvider {
  id: string
  priority: number
  suggest(ctx: SuggestionContext, signal: AbortSignal): Promise<Suggestion | null>
}

export interface ClozeOptions {
  providers: ClozeProvider[]
  debounceMs?: number
  minConfidence?: number
  onSuggestion?: (s: Suggestion | null) => void
  onAccept?: (s: Suggestion) => void
}
