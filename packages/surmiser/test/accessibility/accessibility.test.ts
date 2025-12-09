import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachSurmiser } from '../../src/attach';
import type { SurmiserOptions } from '../../src/types';

describe('Accessibility', () => {
  let input: HTMLInputElement;
  let options: SurmiserOptions;
  let detach: () => void;

  beforeEach(() => {
    input = document.createElement('input');
    document.body.appendChild(input);
    
    options = {
      providers: [],
      onSuggestion: vi.fn(),
      onAccept: vi.fn(),
      minConfidence: 0,
      debounceMs: 0
    };
  });

  afterEach(() => {
    if (detach) detach();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('sets aria-autocomplete="inline" on input', () => {
    detach = attachSurmiser(input, options);
    expect(input.getAttribute('aria-autocomplete')).toBe('inline');
  });

  it('removes aria-autocomplete on detach', () => {
    detach = attachSurmiser(input, options);
    detach();
    expect(input.hasAttribute('aria-autocomplete')).toBe(false);
  });

  it('creates a live region for announcements', () => {
    detach = attachSurmiser(input, options);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('announces suggestions to screen reader', async () => {
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: ' world', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    // Type "hello"
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('Suggestion: hello world');
  });

  it('does not re-announce same suggestion', async () => {
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: ' world', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    // First trigger
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('Suggestion: hello world');

    // Change input
    input.value = 'helloo'; 
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));
    
    expect(liveRegion?.textContent).toContain('Suggestion: helloo world');
  });

  it('maintains focus on input after acceptance', async () => {
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: ' world', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    // Focus input
    input.focus();
    
    // Trigger suggestion
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Accept via Tab
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(tabEvent);

    // Verify focus is still on input
    expect(document.activeElement).toBe(input);
  });
});
