export class GhostRenderer {
  private wrapper: HTMLDivElement
  private ghost: HTMLDivElement
  private prefix: HTMLSpanElement
  private suggestion: HTMLSpanElement
  private originalParent: HTMLElement
  private originalNextSibling: Node | null
  private resizeObserver: ResizeObserver

  constructor(private inputEl: HTMLInputElement) {
    this.originalParent = inputEl.parentElement!
    this.originalNextSibling = inputEl.nextSibling

    // Create wrapper
    this.wrapper = document.createElement('div')
    const inputDisplay = window.getComputedStyle(inputEl).display
    this.wrapper.style.cssText = `position: relative; display: ${inputDisplay === 'block' ? 'block' : 'inline-block'};`

    // Match width behavior
    if (inputEl.style.width) {
      this.wrapper.style.width = inputEl.style.width
    }

    // Create ghost overlay
    this.ghost = document.createElement('div')
    this.ghost.setAttribute('aria-hidden', 'true')
    this.ghost.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      white-space: pre;
      overflow: hidden;
      border-color: transparent;
    `

    // Prefix span (invisible)
    this.prefix = document.createElement('span')
    this.prefix.style.cssText = 'opacity: 0;'

    // Suggestion span (visible, gray)
    this.suggestion = document.createElement('span')
    this.suggestion.style.cssText = 'color: #999;'

    this.ghost.appendChild(this.prefix)
    this.ghost.appendChild(this.suggestion)

    // Save focus state
    const isFocused = document.activeElement === inputEl
    const selectionStart = inputEl.selectionStart
    const selectionEnd = inputEl.selectionEnd

    // Insert wrapper
    this.originalParent.insertBefore(this.wrapper, inputEl)
    this.wrapper.appendChild(inputEl)
    this.wrapper.appendChild(this.ghost)

    // Restore focus state
    if (isFocused) {
      inputEl.focus()
      if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
        inputEl.setSelectionRange(selectionStart, selectionEnd)
      }
    }

    // Sync styles
    this.syncStyles()

    // Watch for resize
    this.resizeObserver = new ResizeObserver(() => this.syncStyles())
    this.resizeObserver.observe(inputEl)
  }

  syncStyles(): void {
    const computed = window.getComputedStyle(this.inputEl)

    const styles = [
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'letter-spacing',
      'line-height',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width',
      'border-top-style',
      'border-right-style',
      'border-bottom-style',
      'border-left-style',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'box-sizing',
      'text-align'
    ]

    styles.forEach(prop => {
      this.ghost.style[prop as any] = computed[prop as any]
    })
  }

  render(text: string, cursorPos: number, suggestionText: string | null): void {
    if (!suggestionText) {
      this.ghost.style.display = 'none'
      return
    }

    this.ghost.style.display = 'block'
    this.prefix.textContent = text.slice(0, cursorPos)
    this.suggestion.textContent = suggestionText
  }

  destroy(): void {
    this.resizeObserver.disconnect()
    this.originalParent.insertBefore(this.inputEl, this.originalNextSibling)
    this.wrapper.remove()
  }
}
