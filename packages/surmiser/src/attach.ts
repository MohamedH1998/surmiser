import { SurmiserEngine } from './engine';
import { GhostRenderer } from './renderer';
import { buildContext } from './context';
import { localPredictive } from './defaults';
import type { SurmiserOptions, SurmiserProvider, Suggestion } from './types';

const SWIPE_THRESHOLD_PX = 50;

/**
 * Encapsulates the logic for binding the Surmiser engine to an input element.
 */
class SurmiserController {
  private engine: SurmiserEngine;
  private renderer: GhostRenderer;

  // State
  private lastValue: string;
  private lastCursorAtEnd = true; // Track cursor position state to avoid unnecessary renders
  private isComposing = false;
  private isDismissed = false;
  private isAccepting = false;
  private touchStart: { x: number; y: number } | null = null;
  private boundHandlers: Record<string, EventListener>;

  constructor(
    private inputEl: HTMLInputElement,
    private options: SurmiserOptions = {}
  ) {
    this.lastValue = inputEl.value;

    // Setup Engine and Renderer
    this.engine = this.createEngine();
    this.renderer = new GhostRenderer(inputEl, () => {
      const suggestion = this.engine.getCurrentSuggestion();
      if (suggestion) this.accept(suggestion);
    });

    // Pre-bind handlers to maintain 'this' context and allow removal
    this.boundHandlers = {
      input: this.handleInput.bind(this) as EventListener,
      keydown: this.handleKeyDown.bind(this) as EventListener,
      keyup: this.handleKeyUp.bind(this) as EventListener,
      click: this.handleClick.bind(this) as EventListener,
      blur: this.handleBlur.bind(this) as EventListener,
      compositionstart: this.handleCompositionStart.bind(this) as EventListener,
      compositionend: this.handleCompositionEnd.bind(this) as EventListener,
      touchstart: this.handleTouchStart.bind(this) as EventListener,
      touchend: this.handleTouchEnd.bind(this) as EventListener,
    };
  }

  public attach(): void {
    const { inputEl } = this;

    // Add event listeners (capture phase where appropriate)
    inputEl.addEventListener('input', this.boundHandlers.input, true);
    inputEl.addEventListener('keydown', this.boundHandlers.keydown, true);
    inputEl.addEventListener('keyup', this.boundHandlers.keyup, true);
    inputEl.addEventListener('click', this.boundHandlers.click, true);
    inputEl.addEventListener('blur', this.boundHandlers.blur, true);
    inputEl.addEventListener(
      'compositionstart',
      this.boundHandlers.compositionstart,
      true
    );
    inputEl.addEventListener(
      'compositionend',
      this.boundHandlers.compositionend,
      true
    );
    inputEl.addEventListener('touchstart', this.boundHandlers.touchstart, {
      passive: true,
    });
    inputEl.addEventListener('touchend', this.boundHandlers.touchend, {
      passive: false,
    });

    this.setupAccessibility();
  }

  public detach(): void {
    const { inputEl } = this;

    inputEl.removeEventListener('input', this.boundHandlers.input, true);
    inputEl.removeEventListener('keydown', this.boundHandlers.keydown, true);
    inputEl.removeEventListener('keyup', this.boundHandlers.keyup, true);
    inputEl.removeEventListener('click', this.boundHandlers.click, true);
    inputEl.removeEventListener('blur', this.boundHandlers.blur, true);
    inputEl.removeEventListener(
      'compositionstart',
      this.boundHandlers.compositionstart,
      true
    );
    inputEl.removeEventListener(
      'compositionend',
      this.boundHandlers.compositionend,
      true
    );
    inputEl.removeEventListener('touchstart', this.boundHandlers.touchstart);
    inputEl.removeEventListener('touchend', this.boundHandlers.touchend);

    this.engine.destroy();
    this.renderer.destroy();
  }

  private createEngine(): SurmiserEngine {
    const providers = this.resolveProviders();

    return new SurmiserEngine({
      ...this.options,
      providers,
      onSuggestion: suggestion => {
        if (!this.isComposing && !this.isDismissed) {
          this.render(suggestion?.text || null);
        }
        this.options.onSuggestion?.(suggestion);
      },
    });
  }

  private resolveProviders(): SurmiserProvider[] {
    if (this.options.corpus && this.options.providers) {
      throw new Error(
        "Surmiser: Cannot use both 'corpus' and 'providers'. " +
          "Use 'corpus' for simple arrays, or 'providers' for advanced use cases."
      );
    }
    if (this.options.corpus) return [localPredictive(this.options.corpus)];
    if (this.options.providers) {
      return Array.isArray(this.options.providers)
        ? [...this.options.providers]
        : [this.options.providers];
    }
    return [localPredictive()];
  }

  private render(suggestionText: string | null): void {
    this.renderer.render(
      this.inputEl.value,
      this.getCursorPos(),
      suggestionText
    );
  }

  private clear(): void {
    this.engine.clearSuggestion();
    this.render(null);
    const value = this.inputEl.value;
    const tokenCount = value.toLowerCase().match(/\w+/g)?.length || 0;
    this.engine.markSegmentBoundary(tokenCount);
  }

  private dismiss(): void {
    this.isDismissed = true;
    this.clear();
  }

  private accept(suggestion: Suggestion): void {
    const { inputEl } = this;
    const cursorPos = inputEl.selectionStart || 0;

    inputEl.setSelectionRange(cursorPos, inputEl.value.length);
    inputEl.focus();

    this.isAccepting = true;

    let success = false;
    if (document?.execCommand) {
      try {
        success = document.execCommand('insertText', false, suggestion.text);
      } catch {
        // Ignore execCommand errors
      }
    }

    if (!success) {
      // Fallback: manual value update
      const newValue = inputEl.value.slice(0, cursorPos) + suggestion.text;
      setInputValue(inputEl, newValue);
      this.lastValue = newValue;

      inputEl.setSelectionRange(newValue.length, newValue.length);
      inputEl.scrollLeft = inputEl.scrollWidth;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      this.lastValue = inputEl.value;
      inputEl.scrollLeft = inputEl.scrollWidth;
    }

    this.cleanupAfterAccept(suggestion);
  }

  private cleanupAfterAccept(suggestion: Suggestion): void {
    this.engine.clearSuggestion();
    this.render(null);
    this.renderer.disableBadge();
    this.options.onAccept?.(suggestion);

    this.isDismissed = false;

    const value = this.inputEl.value;
    const tokenCount = value.toLowerCase().match(/\w+/g)?.length || 0;
    this.engine.markSegmentBoundary(tokenCount);

    this.lastCursorAtEnd = true;

    setTimeout(() => {
      this.isAccepting = false;
    }, 0);
  }

  private getCursorPos(): number {
    return this.inputEl.selectionStart ?? 0;
  }

  private updateGhostForCurrentState(
    value = this.inputEl.value,
    cursorPos = this.getCursorPos(),
    fromInput = false
  ): void {
    const isAtEnd = cursorPos === value.length;
    this.lastCursorAtEnd = isAtEnd;

    // 1) cursor NOT at end → always hide + clear engine suggestion
    if (!isAtEnd) {
      this.engine.clearSuggestion();
      this.renderer.render(value, cursorPos, null);
      this.lastValue = value;
      return;
    }

    if (fromInput) {
      const currentSuggestionText =
        this.engine.getCurrentSuggestion()?.text ?? null;
      let displayText: string | null = null;

      if (!this.isDismissed && currentSuggestionText) {
        displayText = computeDisplaySuggestion(
          currentSuggestionText,
          value,
          this.lastValue
        );
      }

      this.lastValue = value;
      this.renderer.render(value, cursorPos, displayText);

      this.engine.requestSuggestion(buildContext(value, cursorPos));
    } else {
      // navigation/click brought cursor back to end
      // → treat as fresh: don't reuse old suggestion, just request a new one
      this.engine.clearSuggestion();
      this.lastValue = value;
      this.renderer.render(value, cursorPos, null);
      this.engine.requestSuggestion(buildContext(value, cursorPos));
    }
  }

  // --- Event Handlers ---

  private handleInput(): void {
    if (this.isComposing || this.isAccepting) return;

    const value = this.inputEl.value;
    const cursorPos = this.getCursorPos();

    // 1. dismiss gesture (double space)
    if (value.slice(0, cursorPos).endsWith('  ')) {
      this.lastValue = value;
      this.dismiss();
      return;
    }

    // 2. reset dismissed state if user actually types/backspaces
    if (this.isDismissed && this.shouldResetDismissedState(value)) {
      this.isDismissed = false;
    }

    // 3. cleared input
    if (value.length === 0) {
      this.clear();
      this.lastValue = value;
      this.lastCursorAtEnd = true;
      return;
    }

    this.updateGhostForCurrentState(value, cursorPos, true);
  }

  private shouldResetDismissedState(newValue: string): boolean {
    if (newValue.length > this.lastValue.length) {
      const typed = newValue.slice(this.lastValue.length);
      return typed.trim() !== '';
    }
    return newValue.length < this.lastValue.length; // Reset on backspace
  }

  private handleKeyUp(_e: KeyboardEvent): void {
    if (this.isComposing || this.isAccepting) return;

    const cursorPos = this.getCursorPos();
    const isAtEnd = cursorPos === this.lastValue.length;

    if (isAtEnd === this.lastCursorAtEnd) return;

    const value = this.inputEl.value;
    this.updateGhostForCurrentState(value, cursorPos, false);
  }

  private handleClick(): void {
    const value = this.inputEl.value;
    const cursorPos = this.getCursorPos();

    const isAtEnd = cursorPos === value.length;
    if (isAtEnd === this.lastCursorAtEnd) return;

    this.updateGhostForCurrentState(value, cursorPos);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const suggestion = this.engine.getCurrentSuggestion();
    if (!suggestion) return;

    const isCursorAtEnd =
      this.inputEl.selectionStart === this.inputEl.value.length;

    if (e.key === 'Tab') {
      e.preventDefault();
      this.accept(suggestion);
    } else if (e.key === 'ArrowRight' && isCursorAtEnd) {
      e.preventDefault();
      this.accept(suggestion);
    } else if (e.key === 'Escape') {
      this.dismiss();
    }
  }

  private handleCompositionStart(): void {
    this.isComposing = true;
    this.clear();
  }

  private handleCompositionEnd(): void {
    this.isComposing = false;
    this.handleInput();
  }

  private handleBlur(): void {
    this.clear();
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.touchStart) return;

    const suggestion = this.engine.getCurrentSuggestion();
    const touch = e.changedTouches[0];

    if (suggestion && touch) {
      const deltaX = touch.clientX - this.touchStart.x;
      const deltaY = Math.abs(touch.clientY - this.touchStart.y);

      // Swipe right to accept
      if (deltaX > SWIPE_THRESHOLD_PX && deltaX > deltaY * 2) {
        e.preventDefault();
        this.accept(suggestion);
      }
    }
    this.touchStart = null;
  }

  private setupAccessibility(): void {
    if (!this.inputEl.hasAttribute('role')) {
      this.inputEl.setAttribute('role', 'textbox');
    }
    this.inputEl.setAttribute('aria-autocomplete', 'inline');
  }
}

// --- Helper Functions ---

function computeDisplaySuggestion(
  currentSuggestion: string | null,
  value: string,
  lastValue: string
): string | null {
  if (!currentSuggestion) return null;

  // Handle typing - consume matching characters
  if (value.length > lastValue.length) {
    const typed = value.slice(lastValue.length);
    if (currentSuggestion.startsWith(typed)) {
      return currentSuggestion.slice(typed.length) || null;
    }
    return null;
  }
  // Handle deletion
  if (value.length < lastValue.length) return null;

  return currentSuggestion;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set;

  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
}

// --- Main Export ---

export function attachSurmiser(
  inputEl: HTMLInputElement,
  options?: SurmiserOptions
): () => void {
  const controller = new SurmiserController(inputEl, options);
  controller.attach();
  return () => controller.detach();
}
