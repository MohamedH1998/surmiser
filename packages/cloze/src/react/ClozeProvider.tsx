import { createContext, useContext, useMemo } from "react";
import type { ClozeProvider as Provider } from "../types";

interface ClozeContextValue {
  providers: Provider[];
  debounceMs?: number;
  minConfidence?: number;
}

const ClozeContext = createContext<ClozeContextValue | null>(null);

export function useClozeContext() {
  return useContext(ClozeContext);
}

interface ClozeProviderProps {
  provider: Provider | Provider[];
  debounceMs?: number;
  minConfidence?: number;
  children: React.ReactNode;
}

/**
 * Context provider for Cloze. Wrap your app to enable autocomplete.
 *
 * @example
 * ```tsx
 * import { localPredictive } from 'cloze-corpus'
 *
 * <ClozeProvider provider={localPredictive()}>
 *   <App />
 * </ClozeProvider>
 * ```
 */
export function ClozeProvider({
  provider,
  debounceMs,
  minConfidence,
  children,
}: ClozeProviderProps) {
  const providers = useMemo(() => {
    return Array.isArray(provider) ? provider : [provider];
  }, [provider]);

  return (
    <ClozeContext.Provider value={{ providers, debounceMs, minConfidence }}>
      {children}
    </ClozeContext.Provider>
  );
}
