import { createContext, useContext, useMemo } from "react";
import type { SurmiserProvider as Provider } from "../types";
import { localPredictive } from "../defaults";

interface SurmiserContextValue {
  providers: Provider[];
  debounceMs?: number;
  minConfidence?: number;
}

const SurmiserContext = createContext<SurmiserContextValue | null>(null);

export function useSurmiserContext() {
  return useContext(SurmiserContext);
}

interface SurmiserProviderProps {
  /**
   * Simple string array for quick setup.
   * Mutually exclusive with `provider`.
   * 
   * @example corpus={['hello', 'world']}
   */
  corpus?: string[];
  
  /**
   * Advanced: full Provider objects for custom logic (LLM, API, etc)
   * Mutually exclusive with `corpus`.
   * - Pass `string[]` for simple predictive text (same as corpus)
   * - Pass `Provider` or `Provider[]` for advanced use cases
   * 
   * @example provider={customAPIProvider}
   */
  provider?: Provider | Provider[] | string[];
  
  debounceMs?: number;
  minConfidence?: number;
  children: React.ReactNode;
}

/**
 * Context provider for Surmiser. Wrap your app to enable autocomplete.
 *
 * @example
 * ```tsx
 * // Zero Config (Default Corpus)
 * <SurmiserProvider>
 *   <App />
 * </SurmiserProvider>
 *
 * // Custom Simple Corpus
 * <SurmiserProvider corpus={['hello', 'world']}>
 *   <App />
 * </SurmiserProvider>
 *
 * // Advanced: Custom Provider
 * <SurmiserProvider provider={customAPIProvider}>
 *   <App />
 * </SurmiserProvider>
 * ```
 */
export function SurmiserProvider({
  corpus,
  provider,
  debounceMs,
  minConfidence,
  children,
}: SurmiserProviderProps) {
  const providers = useMemo(() => {

    if (corpus && provider) {
      throw new Error(
        "SurmiserProvider: Cannot use both 'corpus' and 'provider'. " +
        "Use 'corpus' for simple arrays, or 'provider' for advanced use cases."
      );
    }

    if (corpus) {
      return [localPredictive(corpus)];
    }

    if (!provider) {
      return [localPredictive()];
    }

    if (Array.isArray(provider) && typeof provider[0] === "string") {
      return [localPredictive(provider as string[])];
    }

    return Array.isArray(provider)
      ? (provider as Provider[])
      : [provider as Provider];
  }, [corpus, provider]);

  const contextValue = useMemo(
    () => ({ providers, debounceMs, minConfidence }),
    [providers, debounceMs, minConfidence]
  );

  return (
    <SurmiserContext.Provider value={contextValue}>
      {children}
    </SurmiserContext.Provider>
  );
}
