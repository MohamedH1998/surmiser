import { createContext, useContext, useMemo } from 'react'
import type { SurmiseProvider as Provider } from '@surmise/core'
import { defaultProvider, localPredictive } from '@surmise/corpus'

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
  /** Provider(s), corpus array(s), or omit for default corpus */
  provider?: Provider | Provider[] | string[] | string[][]
  debounceMs?: number
  minConfidence?: number
  children: React.ReactNode
}

/**
 * Context provider for Surmise. Wrap your app to enable autocomplete.
 *
 * @example
 * ```tsx
 * // Use default corpus
 * <SurmiseProvider>
 *   <App />
 * </SurmiseProvider>
 *
 * // Pass custom corpus
 * <SurmiseProvider provider={['hello', 'world']}>
 *   <App />
 * </SurmiseProvider>
 *
 * // Pass provider directly
 * <SurmiseProvider provider={localPredictive(corpus)}>
 *   <App />
 * </SurmiseProvider>
 * ```
 */
export function SurmiseProvider({ provider, debounceMs, minConfidence, children }: SurmiseProviderProps) {
  const providers = useMemo(() => {
    if (!provider) {
      return [defaultProvider]
    }

    // String array = corpus -> convert to provider
    if (Array.isArray(provider) && typeof provider[0] === 'string') {
      return [localPredictive(provider as string[])]
    }

    // Already provider(s)
    return Array.isArray(provider) ? provider as Provider[] : [provider as Provider]
  }, [provider])

  return (
    <SurmiseContext.Provider value={{ providers, debounceMs, minConfidence }}>
      {children}
    </SurmiseContext.Provider>
  )
}
