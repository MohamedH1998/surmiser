import { forwardRef, useCallback } from 'react'
import { useSurmise } from './useSurmise'

interface SurmiseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  debounceMs?: number
  minConfidence?: number
}

/**
 * Convenience component for quick start.
 *
 * For composition with your own components, use `useSurmise()` hook instead.
 *
 * @example
 * ```tsx
 * // Quick start
 * <SurmiseInput placeholder="Email..." />
 *
 * // For composition - use the hook
 * const { attachRef } = useSurmise()
 * <YourInput ref={attachRef} />
 * ```
 */
export const SurmiseInput = forwardRef<HTMLInputElement, SurmiseInputProps>(
  ({ debounceMs, minConfidence, value, ...props }, ref) => {
    const { attachRef } = useSurmise({
      debounceMs,
      minConfidence,
      value: typeof value === 'string' ? value : undefined
    })

    const mergedRef = useCallback((node: HTMLInputElement | null) => {
      // Call our attachRef
      attachRef(node)

      // Forward to external ref
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }, [attachRef, ref])

    return <input ref={mergedRef} value={value} {...props} />
  }
)

SurmiseInput.displayName = 'SurmiseInput'
