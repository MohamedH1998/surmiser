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
    const hasPerf = typeof performance !== "undefined";
    const startMark = `surmise-fetch-start-${Date.now()}`;
    if (hasPerf) performance.mark(startMark);

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const providers = [...this.options.providers!].sort(
      (a, b) => b.priority - a.priority
    );

    let bestSuggestion: Suggestion | null = null;

    for (const provider of providers) {
      if (signal.aborted) return;

      try {
        const suggestion = await provider.suggest(ctx, signal);

        if (signal.aborted) return;

        if (
          suggestion &&
          suggestion.confidence >= (this.options.minConfidence || 70)
        ) {
          if (suggestion.confidence >= 95) {
            this.currentSuggestion = suggestion;
            this.options.onSuggestion?.(suggestion);
            return;
          }

          if (
            !bestSuggestion ||
            suggestion.confidence > bestSuggestion.confidence
          ) {
            bestSuggestion = suggestion;
          }
        }
      } catch (err) {
        console.error(`Surmiser provider ${provider.id} error:`, err);
      }
    }

    if (bestSuggestion) {
      this.currentSuggestion = bestSuggestion;
      this.options.onSuggestion?.(bestSuggestion);

      if (hasPerf) {
        const endMark = `surmise-fetch-end-${Date.now()}`;
        performance.mark(endMark);
      }
    } else {
      this.currentSuggestion = null;
      this.options.onSuggestion?.(null);
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
