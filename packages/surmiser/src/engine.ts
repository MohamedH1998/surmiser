import type { SuggestionContext, Suggestion, SurmiserOptions } from "./types";

export class SurmiserEngine {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentSuggestion: Suggestion | null = null;

  constructor(private options: SurmiserOptions) {}

  requestSuggestion(ctx: SuggestionContext): void {
    this.cancel();

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestion(ctx);
    }, this.options.debounceMs ?? 200);
  }

  private async fetchSuggestion(ctx: SuggestionContext): Promise<void> {
    const hasPerf = typeof performance !== 'undefined';
    const startMark = `surmise-fetch-start-${Date.now()}`;
    if (hasPerf) performance.mark(startMark);

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const providers = [...this.options.providers!].sort(
      (a, b) => b.priority - a.priority
    );

    for (const provider of providers) {
      if (signal.aborted) return;

      try {
        const suggestion = await provider.suggest(ctx, signal);

        if (signal.aborted) return;

        if (
          suggestion &&
          suggestion.confidence >= (this.options.minConfidence || 70)
        ) {
          this.currentSuggestion = suggestion;
          this.options.onSuggestion?.(suggestion);
          
          if (hasPerf) {
            const endMark = `surmise-fetch-end-${Date.now()}`;
            performance.mark(endMark);
            try {
                performance.measure('surmise-suggestion-fetch', startMark, endMark);
            } catch (e) {
                // Ignore measure errors (e.g. missing start mark)
            }
          }
          return;
        }
      } catch (err) {
        if (signal.aborted) return;
        console.warn(`Provider ${provider.id} failed:`, err);
      }
    }

    this.currentSuggestion = null;
    this.options.onSuggestion?.(null);
    
    if (hasPerf) {
      const endMark = `surmise-fetch-end-${Date.now()}`;
      performance.mark(endMark);
      try {
        performance.measure('surmise-suggestion-fetch-empty', startMark, endMark);
      } catch (e) {
        // Ignore
      }
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  getCurrentSuggestion(): Suggestion | null {
    return this.currentSuggestion;
  }

  clearSuggestion(): void {
    this.currentSuggestion = null;
    this.options.onSuggestion?.(null);
  }

  destroy(): void {
    this.cancel();
  }
}
