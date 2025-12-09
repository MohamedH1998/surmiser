import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { attachSurmiser } from "../attach";
import { localPredictive } from "../defaults";
import type { Suggestion, SurmiserOptions, SurmiserProvider } from "../types";
import { useSurmiserContext } from "./SurmiserProvider";

interface UseSurmiserOptions extends SurmiserOptions {
  value?: string;
}

/**
 * Primary API for composing autocomplete into your own components.
 *
 * Works standalone or within a SurmiserProvider for shared configuration.
 *
 * @example
 * ```tsx
 * // Standalone with default corpus
 * function EmailInput(props) {
 *   const { attachRef } = useSurmiser()
 *   return <YourCustomInput ref={attachRef} {...props} />
 * }
 *
 * // Standalone with custom corpus
 * function CommandInput(props) {
 *   const { attachRef } = useSurmiser({
 *     corpus: ['git commit', 'git push', 'git pull']
 *   })
 *   return <input ref={attachRef} {...props} />
 * }
 *
 * // Within Provider (inherits shared config)
 * function App() {
 *   return (
 *     <SurmiserProvider corpus={['global', 'words']}>
 *       <EmailInput />
 *     </SurmiserProvider>
 *   )
 * }
 * ```
 */
export function useSurmiser(options: UseSurmiserOptions = {}) {
  const context = useSurmiserContext();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const [element, setElement] = useState<HTMLInputElement | null>(null);

  const onAcceptRef = useRef(options.onAccept);

  const defaultProviders = useMemo(() => [localPredictive()], []);
  const {
    providers: ctxProviders = defaultProviders,
    debounceMs: ctxDebounce,
    minConfidence: ctxMinConf,
  } = context || {};

  onAcceptRef.current = options.onAccept;

  const attachRef = useCallback((node: HTMLInputElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;
    const debounceMs = options.debounceMs ?? ctxDebounce;
    const minConfidence = options.minConfidence ?? ctxMinConf;

    let finalProviders: SurmiserProvider[];

    if (options.providers) {
      finalProviders = options.providers;
    } else if (options.corpus) {
      finalProviders = [...ctxProviders, localPredictive(options.corpus)];
    } else {
      finalProviders = ctxProviders;
    }

    const detach = attachSurmiser(element, {
      providers: finalProviders,
      debounceMs,
      minConfidence,
      onSuggestion: setSuggestion,
      onAccept: (s) => {
        setSuggestion(null);
        onAcceptRef.current?.(s);
      },
    });

    return () => {
      detach();
    };
  }, [
    element,
    options.corpus,
    options.providers,
    options.debounceMs,
    options.minConfidence,
    ctxDebounce,
    ctxMinConf,
    ctxProviders,
  ]);

  return { attachRef, suggestion };
}
