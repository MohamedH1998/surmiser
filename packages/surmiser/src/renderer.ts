export class GhostRenderer {
  private ghost: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private prefix: HTMLSpanElement;
  private suggestion: HTMLSpanElement;
  private resizeObserver: ResizeObserver;
  private scrollHandler: () => void;
  private windowResizeHandler: () => void;

  constructor(private inputEl: HTMLInputElement) {
    // Create ghost overlay attached to body to avoid disturbing React DOM
    this.ghost = document.createElement("div");
    this.ghost.setAttribute("aria-hidden", "true");
    this.ghost.style.cssText = `
      position: absolute;
      pointer-events: none;
      overflow: hidden;
      border-color: transparent;
      z-index: 9999;
      background: transparent;
      white-space: pre;
    `;

    // Create wrapper for text content
    this.wrapper = document.createElement("div");
    this.wrapper.style.width = "100%";

    // Prefix span (invisible)
    this.prefix = document.createElement("span");
    this.prefix.style.cssText = "opacity: 0;";

    // Suggestion span (visible, gray)
    this.suggestion = document.createElement("span");
    this.suggestion.style.cssText = "color: #999;";

    this.wrapper.appendChild(this.prefix);
    this.wrapper.appendChild(this.suggestion);
    this.ghost.appendChild(this.wrapper);

    document.body.appendChild(this.ghost);

    // Sync styles
    this.syncStyles();
    this.syncPosition();

    // Watch for resize of input
    this.resizeObserver = new ResizeObserver(() => {
      this.syncStyles();
      this.syncPosition();
    });
    this.resizeObserver.observe(inputEl);

    // Sync scroll position
    this.scrollHandler = () => {
      this.syncScroll();
      // Also sync position in case input moved due to parent scroll
      this.syncPosition();
    };
    // We need to listen to window scroll too to keep position fixed absolute
    this.windowResizeHandler = () => this.syncPosition();

    inputEl.addEventListener("scroll", this.scrollHandler);
    window.addEventListener("resize", this.windowResizeHandler);
    window.addEventListener("scroll", this.windowResizeHandler, true); // Capture to catch all scrolls
  }

  syncStyles(): void {
    const computed = window.getComputedStyle(this.inputEl);

    const styles = [
      "font-family",
      "font-size",
      "font-weight",
      "font-style",
      "letter-spacing",
      "padding-right",
      "padding-left",
      "border-top-width",
      "border-right-width",
      "border-bottom-width",
      "border-left-width",
      "border-top-style",
      "border-right-style",
      "border-bottom-style",
      "border-left-style",
      "text-align",
      "text-transform",
      "text-indent",
    ];

    styles.forEach((prop) => {
      this.ghost.style[prop as any] = computed[prop as any];
    });

    // Explicitly transparent background/border for ghost
    this.ghost.style.backgroundColor = "transparent";
    this.ghost.style.borderColor = "transparent";

    // Force border-box and zero vertical padding to ensure centering works correctly
    this.ghost.style.boxSizing = "border-box";
    this.ghost.style.paddingTop = "0px";
    this.ghost.style.paddingBottom = "0px";
    this.ghost.style.lineHeight = "normal";

    // Use flexbox for alignment
    this.ghost.style.flexDirection = "row";
    this.ghost.style.alignItems = "center";

    // Justify-content not needed as wrapper takes full width and handles alignment
    this.ghost.style.justifyContent = "normal";

    this.syncScroll();
  }

  syncPosition(): void {
    const rect = this.inputEl.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    this.ghost.style.top = `${rect.top + scrollY}px`;
    this.ghost.style.left = `${rect.left + scrollX}px`;
    this.ghost.style.width = `${rect.width}px`;
    this.ghost.style.height = `${rect.height}px`;
  }

  syncScroll(): void {
    this.ghost.scrollLeft = this.inputEl.scrollLeft;
    this.ghost.scrollTop = this.inputEl.scrollTop;
  }

  render(text: string, cursorPos: number, suggestionText: string | null): void {
    this.syncPosition();

    if (!suggestionText) {
      this.ghost.style.display = "none";
      return;
    }

    this.ghost.style.display = "flex";

    const prefixText = text
      .slice(0, cursorPos)
      .replace(/\s+$/, (spaces) => "\u00A0".repeat(spaces.length));
    this.prefix.textContent = prefixText;
    this.suggestion.textContent = suggestionText;
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.inputEl.removeEventListener("scroll", this.scrollHandler);
    window.removeEventListener("resize", this.windowResizeHandler);
    window.removeEventListener("scroll", this.windowResizeHandler, true);
    this.ghost.remove();
  }
}
