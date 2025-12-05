// Local provider - will implement in Phase 5
import type { SurmiseProvider } from '@surmise/core'

export function localPredictive(_phrases: string[]): SurmiseProvider {
  return {
    id: 'local-predictive',
    priority: 10,
    async suggest() {
      // TODO: Phase 5
      return null
    }
  }
}
