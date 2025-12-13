import { createContext, useContext, useMemo } from 'react';
import type { SurmiserProvider as Provider, SurmiserOptions } from '../types';
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

interface SurmiserProviderProps extends Pick<
  SurmiserOptions,
  'corpus' | 'providers' | 'debounceMs' | 'minConfidence'
> {
  children: React.ReactNode;
}

/**
 * Optional context providers for Surmiser. Use to share configuration across multiple inputs.
 *
 * Note: This providers is optional. Components can use useSurmiser() standalone without it.
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
 * <SurmiserProvider providers={customAPIProvider}>
 *   <App />
 * </SurmiserProvider>
 *
 * // Standalone usage (no providers needed)
 * <SurmiserInput corpus={['standalone']} />
 * ```
 */
export function SurmiserProvider({
  corpus,
  providers,
  debounceMs,
  minConfidence,
  children,
}: SurmiserProviderProps) {
  // Stabilize corpus/providers to prevent re-renders from inline arrays/objects
  const corpusKey = corpus ? JSON.stringify(corpus) : undefined;
  const providersKey = useMemo(() => {
    if (!providers) return undefined;
    if (Array.isArray(providers)) {
      return JSON.stringify((providers as Provider[]).map(p => p.id));
    }
    return (providers as Provider).id;
  }, [providers]);

  const mergedProviders = useMemo(() => {
    if (corpus && providers) {
      throw new Error(
        "SurmiserProvider: Cannot use both 'corpus' and 'providers'. " +
          "Use 'corpus' for simple arrays, or 'providers' for advanced use cases."
      );
    }

    if (corpus) {
      return [localPredictive(corpus)];
    }

    if (!providers) {
      return [localPredictive()];
    }

    return Array.isArray(providers)
      ? (providers as Provider[])
      : [providers as Provider];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpus, corpusKey, providers, providersKey]);

  const contextValue = useMemo(
    () => ({ providers: mergedProviders, debounceMs, minConfidence }),
    [mergedProviders, debounceMs, minConfidence]
  );

  return (
    <SurmiserContext.Provider value={contextValue}>
      {children}
    </SurmiserContext.Provider>
  );
}
