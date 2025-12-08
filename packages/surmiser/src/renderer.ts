export class GhostRenderer {
  private ghost: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private prefix: HTMLSpanElement;
  private suggestion: HTMLSpanElement;
  private liveRegion: HTMLDivElement;
  private resizeObserver: ResizeObserver;
  private scrollHandler: () => void;
  private windowResizeHandler: () => void;
  private viewportHandler: (() => void) | null = null;
  private onAccept?: () => void;
  private isMobile: boolean;
  private lastAnnouncement: string = "";

  constructor(private inputEl: HTMLInputElement, onAccept?: () => void) {
    this.onAccept = onAccept;
    this.isMobile = this.detectTouchDevice();

    inputEl.setAttribute("aria-autocomplete", "inline");

    // Create screen reader live region for announcements
    this.liveRegion = document.createElement("div");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.setAttribute("aria-atomic", "true");
    this.liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.liveRegion);

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
      opacity: 0;
      transition: opacity 50ms ease-out;
    `;

    this.wrapper = document.createElement("div");
    this.wrapper.style.width = "100%";

    this.prefix = document.createElement("span");
    this.prefix.style.cssText = "opacity: 0;";

    this.suggestion = document.createElement("span");
    this.suggestion.style.cssText = `
      color: var(--surmiser-suggestion-color, var(--muted-foreground, #999));
      pointer-events: none;
    `;

    this.wrapper.appendChild(this.prefix);
    this.wrapper.appendChild(this.suggestion);
    this.ghost.appendChild(this.wrapper);

    document.body.appendChild(this.ghost);

    // Tap-to-accept handler (mobile only, only active when suggestion visible)
    if (this.isMobile) {
      this.suggestion.addEventListener("click", this.handleTap);
      this.suggestion.addEventListener("touchend", this.handleTap);
    }

    // Sync styles
    this.syncStyles();
    this.syncPosition();

    this.resizeObserver = new ResizeObserver(() => {
      this.syncStyles();
      this.syncPosition();
    });
    this.resizeObserver.observe(inputEl);

    // Sync scroll position
    this.scrollHandler = () => {
      this.syncScroll();
      this.syncPosition();
    };
    this.windowResizeHandler = () => this.syncPosition();

    inputEl.addEventListener("scroll", this.scrollHandler);
    window.addEventListener("resize", this.windowResizeHandler);
    window.addEventListener("scroll", this.windowResizeHandler, true);

    if (window.visualViewport) {
      this.viewportHandler = () => this.syncPosition();
      window.visualViewport.addEventListener("resize", this.viewportHandler);
      window.visualViewport.addEventListener("scroll", this.viewportHandler);
    }
  }

  private detectTouchDevice(): boolean {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  private handleTap = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.onAccept) {
      this.onAccept();
    }
  };

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

    this.ghost.style.backgroundColor = "transparent";
    this.ghost.style.borderColor = "transparent";

    this.ghost.style.boxSizing = "border-box";
    this.ghost.style.paddingTop = "0px";
    this.ghost.style.paddingBottom = "0px";
    this.ghost.style.lineHeight = "normal";

    this.ghost.style.flexDirection = "row";
    this.ghost.style.alignItems = "center";

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
      this.ghost.style.opacity = "0";
      if (this.isMobile) {
        this.suggestion.style.pointerEvents = "none";
      }
      if (this.lastAnnouncement) {
        this.liveRegion.textContent = "";
        this.lastAnnouncement = "";
      }
      return;
    }

    this.ghost.style.display = "flex";
    void this.ghost.offsetHeight;
    this.ghost.style.opacity = "1";

    if (this.isMobile) {
      this.suggestion.style.pointerEvents = "auto";
      this.suggestion.style.cursor = "pointer";
    }

    const prefixText = text
      .slice(0, cursorPos)
      .replace(/\s+$/, (spaces) => "\u00A0".repeat(spaces.length));
    this.prefix.textContent = prefixText;
    this.suggestion.textContent = suggestionText;

    // Announce to screen readers (only if suggestion changed)
    const fullSuggestion = text.slice(0, cursorPos) + suggestionText;
    if (fullSuggestion !== this.lastAnnouncement) {
      this.liveRegion.textContent = `Suggestion: ${fullSuggestion}`;
      this.lastAnnouncement = fullSuggestion;
    }
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.inputEl.removeEventListener("scroll", this.scrollHandler);
    this.inputEl.removeAttribute("aria-autocomplete");
    window.removeEventListener("resize", this.windowResizeHandler);
    window.removeEventListener("scroll", this.windowResizeHandler, true);
    if (this.isMobile) {
      this.suggestion.removeEventListener("click", this.handleTap);
      this.suggestion.removeEventListener("touchend", this.handleTap);
    }
    if (window.visualViewport && this.viewportHandler) {
      window.visualViewport.removeEventListener("resize", this.viewportHandler);
      window.visualViewport.removeEventListener("scroll", this.viewportHandler);
    }
    this.ghost.remove();
    this.liveRegion.remove();
  }
}
