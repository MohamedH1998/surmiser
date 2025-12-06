import { createContext, useContext, useMemo } from "react";
import type { SurmiserProvider as Provider } from "../types";

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
  provider: Provider | Provider[];
  debounceMs?: number;
  minConfidence?: number;
  children: React.ReactNode;
}

/**
 * Context provider for Surmiser. Wrap your app to enable autocomplete.
 *
 * @example
 * ```tsx
 * import { localPredictive } from 'surmiser-corpus'
 *
 * <SurmiserProvider provider={localPredictive()}>
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
    return Array.isArray(provider) ? provider : [provider];
  }, [provider]);

  return (
    <SurmiserContext.Provider value={{ providers, debounceMs, minConfidence }}>
      {children}
    </SurmiserContext.Provider>
  );
}
