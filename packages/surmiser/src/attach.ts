import { SurmiserEngine } from "./engine";
import { GhostRenderer } from "./renderer";
import { buildContext } from "./context";
import { localPredictive } from "./defaults";
import type { SurmiserOptions, SurmiserProvider, Suggestion } from "./types";

const SWIPE_THRESHOLD_PX = 50;

/**
 * Compute what suggestion text to display while waiting for new suggestions.
 * Handles smooth transitions by consuming typed characters that match the suggestion.
 */
function computeDisplaySuggestion(
  currentSuggestion: string | null,
  value: string,
  lastValue: string
): string | null {
  if (!currentSuggestion) return null;

  // Handle typing - consume matching characters from suggestion
  if (value.length > lastValue.length) {
    const typed = value.slice(lastValue.length);
    if (currentSuggestion.startsWith(typed)) {
      return currentSuggestion.slice(typed.length) || null;
    }
    // Typed something different
    return null;
  }

  // Handle deletion
  if (value.length < lastValue.length) return null;

  // No change
  return currentSuggestion;
}

/**
 * Check if text ends with double space (dismiss gesture).
 */
function endsWithDoubleSpace(text: string): boolean {
  return text.endsWith("  ");
}

/**
 * Set input value in a way that triggers React's onChange.
 */
function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
}

export function attachSurmiser(
  inputEl: HTMLInputElement,
  options: SurmiserOptions
): () => void {
  // State
  let lastValue = inputEl.value;
  let isComposing = false;
  let isDismissed = false; // True after double-space dismiss, until user types non-space
  let touchStart: { x: number; y: number } | null = null;

  if (options.corpus && options.providers) {
    throw new Error(
      "Surmiser: Cannot use both 'corpus' and 'providers'. " +
        "Use 'corpus' for simple arrays, or 'providers' for advanced use cases. " +
        "For multiple corpora: providers: [localPredictive(corpus1), localPredictive(corpus2)]"
    );
  }

  let providers: SurmiserProvider[];

  if (options.corpus) {
    providers = [localPredictive(options.corpus)];
  } else if (options.providers) {
    providers = [...options.providers];
  } else {
    providers = [localPredictive()];
  }

  // Core components
  const engineOptions: SurmiserOptions = {
    ...options,
    providers,
    onSuggestion: (suggestion) => {
      if (!isComposing && !isDismissed) {
        render(suggestion?.text || null);
      }
      options.onSuggestion?.(suggestion);
    },
  };

  const engine = new SurmiserEngine(engineOptions);

  const renderer = new GhostRenderer(inputEl, () => {
    const suggestion = engine.getCurrentSuggestion();
    if (suggestion) accept(suggestion);
  });

  const render = (suggestion: string | null) => {
    renderer.render(inputEl.value, inputEl.selectionStart || 0, suggestion);
  };

  const clear = () => {
    engine.clearSuggestion();
    render(null);
  };

  const dismiss = () => {
    isDismissed = true;
    clear();
  };

  const accept = (suggestion: Suggestion) => {
    const cursorPos = inputEl.selectionStart || 0;

    inputEl.setSelectionRange(cursorPos, inputEl.value.length);
    inputEl.focus();

    let success = false;
    if (
      typeof document !== "undefined" &&
      typeof document.execCommand === "function"
    ) {
      try {
        success = document.execCommand("insertText", false, suggestion.text);
      } catch (e) {}
    }

    if (!success) {
      const newValue = inputEl.value.slice(0, cursorPos) + suggestion.text;
      setInputValue(inputEl, newValue);
      lastValue = newValue;

      inputEl.setSelectionRange(newValue.length, newValue.length);
      inputEl.scrollLeft = inputEl.scrollWidth;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      lastValue = inputEl.value;
    }

    engine.clearSuggestion();
    render(null);
    options.onAccept?.(suggestion);

    isDismissed = false;
  };

  const handleInput = () => {
    if (isComposing) return;

    const value = inputEl.value;
    const cursorPos = inputEl.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);

    if (endsWithDoubleSpace(textBeforeCursor)) {
      lastValue = value;
      dismiss();
      return;
    }

    if (isDismissed) {
      if (value.length > lastValue.length) {
        const typed = value.slice(lastValue.length);
        if (typed.trim() !== "") {
          isDismissed = false;
        }
      } else if (value.length < lastValue.length) {
        isDismissed = false;
      }
    }

    const currentText = engine.getCurrentSuggestion()?.text || null;
    const displayText = isDismissed
      ? null
      : computeDisplaySuggestion(currentText, value, lastValue);
    lastValue = value;
    renderer.render(value, cursorPos, displayText);

    // Request new suggestion
    engine.requestSuggestion(buildContext(value, cursorPos));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const suggestion = engine.getCurrentSuggestion();
    if (!suggestion) return;

    if (e.key === "Tab") {
      e.preventDefault();
      accept(suggestion);
    } else if (
      e.key === "ArrowRight" &&
      inputEl.selectionStart === inputEl.value.length
    ) {
      e.preventDefault();
      accept(suggestion);
    } else if (e.key === "Escape") {
      dismiss();
    }
  };

  const handleCompositionStart = () => {
    isComposing = true;
    clear();
  };

  const handleCompositionEnd = () => {
    isComposing = false;
    handleInput();
  };

  const handleBlur = () => clear();

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart) return;

    const suggestion = engine.getCurrentSuggestion();
    const touch = e.changedTouches[0];

    if (suggestion && touch) {
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = Math.abs(touch.clientY - touchStart.y);

      // Swipe right to accept
      if (deltaX > SWIPE_THRESHOLD_PX && deltaX > deltaY * 2) {
        e.preventDefault();
        accept(suggestion);
      }
    }

    touchStart = null;
  };

  // Attach listeners (capture phase to get events first)
  inputEl.addEventListener("input", handleInput, true);
  inputEl.addEventListener("keydown", handleKeyDown, true);
  inputEl.addEventListener("blur", handleBlur, true);
  inputEl.addEventListener("compositionstart", handleCompositionStart, true);
  inputEl.addEventListener("compositionend", handleCompositionEnd, true);
  inputEl.addEventListener("touchstart", handleTouchStart, { passive: true });
  inputEl.addEventListener("touchend", handleTouchEnd, { passive: false });

  // Cleanup
  return () => {
    inputEl.removeEventListener("input", handleInput, true);
    inputEl.removeEventListener("keydown", handleKeyDown, true);
    inputEl.removeEventListener("blur", handleBlur, true);
    inputEl.removeEventListener(
      "compositionstart",
      handleCompositionStart,
      true
    );
    inputEl.removeEventListener("compositionend", handleCompositionEnd, true);
    inputEl.removeEventListener("touchstart", handleTouchStart);
    inputEl.removeEventListener("touchend", handleTouchEnd);
    engine.destroy();
    renderer.destroy();
  };
}
