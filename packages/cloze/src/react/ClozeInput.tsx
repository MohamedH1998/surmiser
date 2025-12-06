import { forwardRef, useCallback } from 'react'
import { useCloze } from './useCloze'

interface ClozeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  debounceMs?: number
  minConfidence?: number
}

/**
 * Convenience component for quick start.
 *
 * For composition with your own components, use `useCloze()` hook instead.
 *
 * @example
 * ```tsx
 * // Quick start
 * <ClozeInput placeholder="Email..." />
 *
 * // For composition - use the hook
 * const { attachRef } = useCloze()
 * <YourInput ref={attachRef} />
 * ```
 */
export const ClozeInput = forwardRef<HTMLInputElement, ClozeInputProps>(
  ({ debounceMs, minConfidence, value, ...props }, ref) => {
    const { attachRef } = useCloze({
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

ClozeInput.displayName = 'ClozeInput'
