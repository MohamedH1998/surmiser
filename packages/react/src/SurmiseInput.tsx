// SurmiseInput component - will implement in Phase 6
import { forwardRef } from 'react'
import { useSurmise } from './useSurmise'
import type { SurmiseProvider } from '@surmise/core'

interface SurmiseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  provider?: SurmiseProvider | SurmiseProvider[]
}

export const SurmiseInput = forwardRef<HTMLInputElement, SurmiseInputProps>(
  ({ provider, ...props }, _ref) => {
    const { attachRef } = useSurmise({ provider })
    return <input ref={attachRef} {...props} />
  }
)

SurmiseInput.displayName = 'SurmiseInput'
