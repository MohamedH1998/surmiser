import { useCallback, useEffect, useRef, useState } from 'react'
import { attachCloze } from '../attach'
import type { Suggestion } from '../types'
import { useClozeContext } from './ClozeProvider'

interface UseClozeOptions {
  debounceMs?: number
  minConfidence?: number
  onAccept?: (s: Suggestion) => void
  /** For controlled components: pass value to sync when it changes programmatically */
  value?: string
}

/**
 * Primary API for composing autocomplete into your own components.
 *
 * @example
 * ```tsx
 * function EmailInput(props) {
 *   const { attachRef } = useCloze()
 *   return <YourCustomInput ref={attachRef} {...props} />
 * }
 * ```
 *
 * Works with any input component (shadcn, Radix, custom, etc.)
 */
export function useCloze(options: UseClozeOptions = {}) {
  const context = useClozeContext()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const detachRef = useRef<(() => void) | null>(null)
  const onAcceptRef = useRef(options.onAccept)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (!context) {
    throw new Error('useCloze must be used within a ClozeProvider')
  }

  // Keep callback ref up to date (no effect needed - refs don't trigger re-renders)
  onAcceptRef.current = options.onAccept

  // Sync when controlled value changes
  useEffect(() => {
    if (options.value !== undefined && inputRef.current) {
      // Trigger input event to re-render
      const event = new Event('input', { bubbles: true })
      inputRef.current.dispatchEvent(event)
    }
  }, [options.value])

  const attachRef = useCallback((node: HTMLInputElement | null) => {
    // Cleanup previous attachment
    detachRef.current?.()
    inputRef.current = node

    if (node) {
      const providers = context.providers
      const debounceMs = options.debounceMs ?? context.debounceMs
      const minConfidence = options.minConfidence ?? context.minConfidence

      detachRef.current = attachCloze(node, {
        providers,
        debounceMs,
        minConfidence,
        onSuggestion: setSuggestion,
        onAccept: (s) => {
          setSuggestion(null)
          onAcceptRef.current?.(s)
        }
      })
    }
  }, [options.debounceMs, options.minConfidence, context])

  useEffect(() => {
    return () => detachRef.current?.()
  }, [])

  return { attachRef, suggestion }
}
