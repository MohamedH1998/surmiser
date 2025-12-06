import { SurmiseEngine } from './engine'
import { GhostRenderer } from './renderer'
import { buildContext } from './context'
import type { SurmiseOptions, Suggestion } from './types'

export function attachSurmise(
  inputEl: HTMLInputElement,
  options: SurmiseOptions
): () => void {
  const engine = new SurmiseEngine({
    ...options,
    onSuggestion: (suggestion) => {
      if (!isComposing) {
        renderer.render(
          inputEl.value,
          inputEl.selectionStart || 0,
          suggestion?.text || null
        )
      }
      options.onSuggestion?.(suggestion)
    }
  })

  const renderer = new GhostRenderer(inputEl)

  let isComposing = false

  const onInput = () => {
    if (isComposing) return

    // Clear ghost immediately for instant feedback
    renderer.render(inputEl.value, inputEl.selectionStart || 0, null)

    const value = inputEl.value
    const cursorPos = inputEl.selectionStart || 0
    const ctx = buildContext(value, cursorPos)

    engine.requestSuggestion(ctx)
  }

  const onCompositionStart = () => {
    isComposing = true
    engine.clearSuggestion()
    renderer.render(inputEl.value, inputEl.selectionStart || 0, null)
  }

  const onCompositionEnd = () => {
    isComposing = false
    onInput()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const suggestion = engine.getCurrentSuggestion()
    if (!suggestion) return

    // Tab: accept
    if (e.key === 'Tab') {
      e.preventDefault()
      acceptSuggestion(suggestion)
      return
    }

    // ArrowRight: accept if cursor at end
    if (e.key === 'ArrowRight' && inputEl.selectionStart === inputEl.value.length) {
      e.preventDefault()
      acceptSuggestion(suggestion)
      return
    }

    // Escape: dismiss
    if (e.key === 'Escape') {
      engine.clearSuggestion()
      renderer.render(inputEl.value, inputEl.selectionStart || 0, null)
      return
    }
  }

  const acceptSuggestion = (suggestion: Suggestion) => {
    const cursorPos = inputEl.selectionStart || 0
    const newValue = inputEl.value.slice(0, cursorPos) + suggestion.text

    inputEl.value = newValue
    inputEl.setSelectionRange(newValue.length, newValue.length)

    // Force scroll to cursor
    inputEl.blur()
    inputEl.focus()

    // Trigger input event for controlled components
    inputEl.dispatchEvent(new Event('input', { bubbles: true }))

    engine.clearSuggestion()
    renderer.render(newValue, newValue.length, null)

    options.onAccept?.(suggestion)
  }

  const onBlur = () => {
    engine.clearSuggestion()
    renderer.render(inputEl.value, inputEl.selectionStart || 0, null)
  }

  // Attach listeners
  inputEl.addEventListener('input', onInput)
  inputEl.addEventListener('keydown', onKeyDown)
  inputEl.addEventListener('blur', onBlur)
  inputEl.addEventListener('compositionstart', onCompositionStart)
  inputEl.addEventListener('compositionend', onCompositionEnd)

  // Cleanup
  return () => {
    inputEl.removeEventListener('input', onInput)
    inputEl.removeEventListener('keydown', onKeyDown)
    inputEl.removeEventListener('blur', onBlur)
    inputEl.removeEventListener('compositionstart', onCompositionStart)
    inputEl.removeEventListener('compositionend', onCompositionEnd)
    engine.destroy()
    renderer.destroy()
  }
}
