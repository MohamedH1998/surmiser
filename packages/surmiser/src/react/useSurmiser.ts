import { useCallback, useEffect, useRef, useState } from "react";
import { attachSurmiser } from "../attach";
import type { Suggestion } from "../types";
import { useSurmiserContext } from "./SurmiserProvider";

interface UseSurmiserOptions {
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
    providers,
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

    const detach = attachSurmiser(element, {
      providers,
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
    options.debounceMs,
    options.minConfidence,
    ctxDebounce,
    ctxMinConf,
    providers,
  ]);

  return { attachRef, suggestion };
}
