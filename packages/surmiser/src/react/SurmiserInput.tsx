import { forwardRef, useCallback } from 'react';
import { useSurmiser } from './useSurmiser';
import type { SurmiserOptions } from '../types';

interface SurmiserInputProps
  extends Pick<SurmiserOptions, 'corpus' | 'providers' | 'debounceMs' | 'minConfidence'>,
          React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Convenience component for quick start. Works standalone or within a SurmiserProvider.
 *
 * For composition with your own components, use `useSurmiser()` hook instead.
 *
 * @example
 * ```tsx
 * // Standalone with default corpus
 * <SurmiserInput placeholder="Email..." />
 *
 * // Standalone with custom corpus
 * <SurmiserInput
 *   corpus={['hello', 'world']}
 *   placeholder="Type..."
 * />
 *
 * // Within Provider (inherits shared config)
 * <SurmiserProvider corpus={['global']}>
 *   <SurmiserInput placeholder="Type..." />
 * </SurmiserProvider>
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
      value: typeof value === 'string' ? value : undefined,
    });

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        attachRef(node);

        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [attachRef, ref]
    );

    return <input ref={mergedRef} value={value} {...props} />;
  }
);

SurmiserInput.displayName = 'SurmiserInput';
