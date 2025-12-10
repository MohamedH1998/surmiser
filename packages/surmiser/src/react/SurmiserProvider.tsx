import { createContext, useContext, useMemo } from 'react';
import type { SurmiserProvider as Provider } from '../types';
import { localPredictive } from '../defaults';

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
 * Optional context provider for Surmiser. Use to share configuration across multiple inputs.
 *
 * Note: This provider is optional. Components can use useSurmiser() standalone without it.
 *
 * @example
 * ```tsx
 * // Zero Config (Default Corpus)
 * <SurmiserProvider>
 *   <App />
 * </SurmiserProvider>
 *
 * // Custom Simple Corpus - shared across all inputs
 * <SurmiserProvider corpus={['hello', 'world']}>
 *   <App />
 * </SurmiserProvider>
 *
 * // Advanced: Custom Provider
 * <SurmiserProvider provider={customAPIProvider}>
 *   <App />
 * </SurmiserProvider>
 *
 * // Standalone usage (no provider needed)
 * <SurmiserInput corpus={['standalone']} />
 * ```
 */
export function SurmiserProvider({
  corpus,
  provider,
  debounceMs,
  minConfidence,
  children,
}: SurmiserProviderProps) {
  // Stabilize corpus/provider to prevent re-renders from inline arrays/objects
  const corpusKey = corpus ? JSON.stringify(corpus) : undefined;
  const providerKey = useMemo(() => {
    if (!provider) return undefined;
    if (Array.isArray(provider)) {
      return typeof provider[0] === 'string'
        ? JSON.stringify(provider)
        : JSON.stringify((provider as Provider[]).map(p => p.id));
    }
    return (provider as Provider).id;
  }, [provider]);

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

    if (Array.isArray(provider) && typeof provider[0] === 'string') {
      return [localPredictive(provider as string[])];
    }

    return Array.isArray(provider)
      ? (provider as Provider[])
      : [provider as Provider];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpus, corpusKey, provider, providerKey]);

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
