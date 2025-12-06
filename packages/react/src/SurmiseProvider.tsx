import { createContext, useContext } from 'react'
import type { SurmiseProvider as Provider } from '@surmise/core'

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
  provider?: Provider | Provider[]
  debounceMs?: number
  minConfidence?: number
  children: React.ReactNode
}

/**
 * Context provider for Surmise. Wrap your app to enable autocomplete.
 *
 * @example
 * ```tsx
 * <SurmiseProvider provider={localPredictive(corpus)}>
 *   <App />
 * </SurmiseProvider>
 * ```
 */
export function SurmiseProvider({ provider, debounceMs, minConfidence, children }: SurmiseProviderProps) {
  const providers = provider
    ? Array.isArray(provider)
      ? provider
      : [provider]
    : []

  return (
    <SurmiseContext.Provider value={{ providers, debounceMs, minConfidence }}>
      {children}
    </SurmiseContext.Provider>
  )
}
