import { createContext, useContext, useMemo } from 'react'
import type { SurmiseProvider as Provider } from '../types'

interface SurmiseContextValue {
  providers: Provider[]
  debounceMs?: number
  minConfidence?: number
}

const SurmiseContext = createContext<SurmiseContextValue | null>(null)

export function useSurmiseContext() {
  return useContext(SurmiseContext)
}

interface SurmiseProviderProps {
  provider: Provider | Provider[]
  debounceMs?: number
  minConfidence?: number
  children: React.ReactNode
}

/**
 * Context provider for Surmise. Wrap your app to enable autocomplete.
 *
 * @example
 * ```tsx
 * import { localPredictive } from '@surmise/corpus'
 *
 * <SurmiseProvider provider={localPredictive()}>
 *   <App />
 * </SurmiseProvider>
 * ```
 */
export function SurmiseProvider({ provider, debounceMs, minConfidence, children }: SurmiseProviderProps) {
  const providers = useMemo(() => {
    return Array.isArray(provider) ? provider : [provider]
  }, [provider])

  return (
    <SurmiseContext.Provider value={{ providers, debounceMs, minConfidence }}>
      {children}
    </SurmiseContext.Provider>
  )
}
