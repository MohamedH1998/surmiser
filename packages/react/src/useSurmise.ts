// useSurmise hook - will implement in Phase 6
import { useCallback, useState } from 'react'
import type { SurmiseProvider, Suggestion } from '@surmise/core'

interface UseSurmiseOptions {
  provider?: SurmiseProvider | SurmiseProvider[]
  debounceMs?: number
  minConfidence?: number
  onAccept?: (s: Suggestion) => void
}

export function useSurmise(_options: UseSurmiseOptions = {}) {
  const [suggestion] = useState<Suggestion | null>(null)

  const attachRef = useCallback((_node: HTMLInputElement | null) => {
    // TODO: Phase 6
  }, [])

  return { attachRef, suggestion }
}
