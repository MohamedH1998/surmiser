import { forwardRef, useCallback } from 'react'
import { useSurmiser } from './useSurmiser'
import type { SurmiserProvider } from '../types'

interface SurmiserInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  corpus?: string[]
  providers?: SurmiserProvider[]
  debounceMs?: number
  minConfidence?: number
}

/**
 * Convenience component for quick start.
 *
 * For composition with your own components, use `useSurmiser()` hook instead.
 *
 * @example
 * ```tsx
 * // Quick start
 * <SurmiserInput placeholder="Email..." />
 *
 * // With custom corpus
 * <SurmiserInput 
 *   corpus={['hello', 'world']} 
 *   placeholder="Type..." 
 * />
 *
 * // For composition - use the hook
 * const { attachRef } = useSurmiser()
 * <YourInput ref={attachRef} />
 * ```
 */
export const SurmiserInput = forwardRef<HTMLInputElement, SurmiserInputProps>(
  ({ corpus, providers, debounceMs, minConfidence, value, ...props }, ref) => {
    const { attachRef } = useSurmiser({
      corpus,
      providers,
      debounceMs,
      minConfidence,
      value: typeof value === 'string' ? value : undefined
    })

    const mergedRef = useCallback((node: HTMLInputElement | null) => {
      attachRef(node)

      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }, [attachRef, ref])

    return <input ref={mergedRef} value={value} {...props} />
  }
)

SurmiserInput.displayName = 'SurmiserInput'
