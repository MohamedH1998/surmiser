import { SurmiserEngine } from "./engine";
import { GhostRenderer } from "./renderer";
import { buildContext } from "./context";
import type { SurmiserOptions, Suggestion } from "./types";

export function attachSurmiser(
  inputEl: HTMLInputElement,
  options: SurmiserOptions
): () => void {
  const engine = new SurmiserEngine({
    ...options,
    onSuggestion: (suggestion) => {
      if (!isComposing) {
        renderer.render(
          inputEl.value,
          inputEl.selectionStart || 0,
          suggestion?.text || null
        );
      }
      options.onSuggestion?.(suggestion);
    },
  });

  const renderer = new GhostRenderer(inputEl);

  let isComposing = false;

  const onInput = (_e: Event) => {
    if (isComposing) return;

    renderer.render(inputEl.value, inputEl.selectionStart || 0, null);

    const value = inputEl.value;
    const cursorPos = inputEl.selectionStart || 0;
    const ctx = buildContext(value, cursorPos);

    engine.requestSuggestion(ctx);
  };

  const onCompositionStart = () => {
    isComposing = true;
    engine.clearSuggestion();
    renderer.render(inputEl.value, inputEl.selectionStart || 0, null);
  };

  const onCompositionEnd = () => {
    isComposing = false;
    onInput(new Event("input"));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const suggestion = engine.getCurrentSuggestion();
    if (!suggestion) return;

    // Tab: accept
    if (e.key === "Tab") {
      e.preventDefault();
      acceptSuggestion(suggestion);
      return;
    }

    // ArrowRight: accept if cursor at end
    if (
      e.key === "ArrowRight" &&
      inputEl.selectionStart === inputEl.value.length
    ) {
      e.preventDefault();
      acceptSuggestion(suggestion);
      return;
    }

    // Escape: dismiss
    if (e.key === "Escape") {
      engine.clearSuggestion();
      renderer.render(inputEl.value, inputEl.selectionStart || 0, null);
      return;
    }
  };

  const acceptSuggestion = (suggestion: Suggestion) => {
    const cursorPos = inputEl.selectionStart || 0;
    const newValue = inputEl.value.slice(0, cursorPos) + suggestion.text;

    // React 16+ hack to trigger onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputEl, newValue);
    } else {
      inputEl.value = newValue;
    }

    inputEl.setSelectionRange(newValue.length, newValue.length);
    inputEl.scrollLeft = inputEl.scrollWidth;

    // Trigger input event for controlled components
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    engine.clearSuggestion();
    renderer.render(newValue, newValue.length, null);
    options.onAccept?.(suggestion);
  };

  const onBlur = () => {
    engine.clearSuggestion();
    renderer.render(inputEl.value, inputEl.selectionStart || 0, null);
  };

  // Attach listeners
  // Use capture to ensure we get events before others might stop them
  inputEl.addEventListener("input", onInput, true);
  inputEl.addEventListener("keydown", onKeyDown, true);
  inputEl.addEventListener("blur", onBlur, true);
  inputEl.addEventListener("compositionstart", onCompositionStart, true);
  inputEl.addEventListener("compositionend", onCompositionEnd, true);

  // Cleanup
  return () => {
    inputEl.removeEventListener("input", onInput, true);
    inputEl.removeEventListener("keydown", onKeyDown, true);
    inputEl.removeEventListener("blur", onBlur, true);
    inputEl.removeEventListener("compositionstart", onCompositionStart, true);
    inputEl.removeEventListener("compositionend", onCompositionEnd, true);
    engine.destroy();
    renderer.destroy();
  };
}
