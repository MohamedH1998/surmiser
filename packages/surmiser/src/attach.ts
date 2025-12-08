import { SurmiserEngine } from "./engine";
import { GhostRenderer } from "./renderer";
import { buildContext } from "./context";
import type { SurmiserOptions, Suggestion } from "./types";

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

  // Core components
  const engine = new SurmiserEngine({
    ...options,
    onSuggestion: (suggestion) => {
      if (!isComposing && !isDismissed) {
        render(suggestion?.text || null);
      }
      options.onSuggestion?.(suggestion);
    },
  });

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
    const newValue = inputEl.value.slice(0, cursorPos) + suggestion.text;
    setInputValue(inputEl, newValue);
    lastValue = newValue;

    engine.clearSuggestion();
    render(null);
    options.onAccept?.(suggestion);

    isDismissed = false;

    inputEl.setSelectionRange(newValue.length, newValue.length);
    inputEl.scrollLeft = inputEl.scrollWidth;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  };

  // Event handlers
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
