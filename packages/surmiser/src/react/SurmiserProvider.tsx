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
   * - Omit for default "Batteries Included" corpus
   * - Pass `string[]` for simple custom predictive text
   * - Pass `Provider` for full custom logic (LLM, API, etc)
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
 * <SurmiserProvider provider={['hello', 'world']}>
 *   <App />
 * </SurmiserProvider>
 * ```
 */
export function SurmiserProvider({
  provider,
  debounceMs,
  minConfidence,
  children,
}: SurmiserProviderProps) {
  const providers = useMemo(() => {
    if (!provider) {
      return [localPredictive()];
    }

    if (Array.isArray(provider) && typeof provider[0] === "string") {
      return [localPredictive(provider as string[])];
    }

    return Array.isArray(provider)
      ? (provider as Provider[])
      : [provider as Provider];
  }, [provider]);

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
