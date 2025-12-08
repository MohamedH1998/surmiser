import { useCallback, useEffect, useRef, useState } from "react";
import { attachSurmiser } from "../attach";
import { localPredictive } from "../defaults";
import type { Suggestion, SurmiserProvider } from "../types";
import { useSurmiserContext } from "./SurmiserProvider";

interface UseSurmiserOptions {
  corpus?: string[];
  providers?: SurmiserProvider[];
  debounceMs?: number;
  minConfidence?: number;
  onAccept?: (s: Suggestion) => void;
  value?: string;
}

/**
 * Primary API for composing autocomplete into your own components.
 *
 * @example
 * ```tsx
 * // Zero Config
 * function EmailInput(props) {
 *   const { attachRef } = useSurmiser()
 *   return <YourCustomInput ref={attachRef} {...props} />
 * }
 *
 * // With custom corpus
 * function CommandInput(props) {
 *   const { attachRef } = useSurmiser({
 *     corpus: ['git commit', 'git push', 'git pull']
 *   })
 *   return <input ref={attachRef} {...props} />
 * }
 * ```
 */
export function useSurmiser(options: UseSurmiserOptions = {}) {
  const context = useSurmiserContext();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const [element, setElement] = useState<HTMLInputElement | null>(null);

  const onAcceptRef = useRef(options.onAccept);

  if (!context) {
    throw new Error("useSurmiser must be used within a SurmiserProvider");
  }

  const {
    providers: ctxProviders,
    debounceMs: ctxDebounce,
    minConfidence: ctxMinConf,
  } = context;

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
