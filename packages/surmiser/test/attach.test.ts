import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachSurmiser } from '../src/attach';
import type { SurmiserOptions } from '../src/types';

describe('attachSurmiser', () => {
  let input: HTMLInputElement;
  let options: SurmiserOptions;
  let detach: () => void;

  beforeEach(() => {
    // Setup DOM
    input = document.createElement('input');
    document.body.appendChild(input);
    
    // Setup options
    options = {
      providers: [], // Mock providers or empty
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

  it('triggers suggestion flow on input', async () => {
    const suggestMock = vi.fn().mockResolvedValue({ text: 'world', confidence: 100 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    
    detach = attachSurmiser(input, options);

    // Simulate typing "hello"
    input.value = 'hello';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for async operations
    await new Promise(r => setTimeout(r, 10));

    expect(suggestMock).toHaveBeenCalled();
  });

  it('accepts suggestion on Tab', async () => {
    // Mock provider to return the SUFFIX ('leted' for 'completed')
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: 'leted', confidence: 100 }) 
    }];
    
    detach = attachSurmiser(input, options);

    // Trigger suggestion
    input.value = 'comp';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Simulate Tab
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
    // onAccept calls with the suggestion object, so it receives 'leted'
    expect(options.onAccept).toHaveBeenCalledWith(expect.objectContaining({ text: 'leted' }));
    expect(input.value).toBe('completed');
  });

  it('accepts suggestion on ArrowRight at end of input', async () => {
    // Mock provider to return SUFFIX ('xt' for 'next')
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: 'xt', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    input.value = 'ne';
    input.selectionStart = 2; // End of input
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    input.dispatchEvent(arrowEvent);

    expect(arrowEvent.defaultPrevented).toBe(true);
    expect(input.value).toBe('next');
  });

  it('does NOT accept ArrowRight if cursor is not at end', async () => {
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: 'next', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    input.value = 'ne';
    input.selectionStart = 1; // Middle of input
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    input.dispatchEvent(arrowEvent);

    expect(arrowEvent.defaultPrevented).toBe(false);
    expect(input.value).toBe('ne');
  });

  it('dismisses suggestion on Escape', async () => {
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: 'dismiss-me', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    input.value = 'dis';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Should have suggestion
    expect(options.onSuggestion).toHaveBeenCalledWith(expect.objectContaining({ text: 'dismiss-me' }));

    // Press Escape
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // Should clear suggestion (we check if onSuggestion called with null)
    expect(options.onSuggestion).toHaveBeenLastCalledWith(null);
  });

  it('clears suggestions on blur', async () => {
    options.providers = [{ 
      id: 'mock', 
      priority: 1, 
      suggest: vi.fn().mockResolvedValue({ text: 'blur-test', confidence: 100 }) 
    }];
    detach = attachSurmiser(input, options);

    input.value = 'bl';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    input.dispatchEvent(new Event('blur'));

    expect(options.onSuggestion).toHaveBeenLastCalledWith(null);
  });

  it('cleans up event listeners on detach', () => {
    detach = attachSurmiser(input, options);
    
    // Spy on removeEventListener
    const removeSpy = vi.spyOn(input, 'removeEventListener');
    
    detach();

    expect(removeSpy).toHaveBeenCalledWith('input', expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith('blur', expect.any(Function), true);
  });
});

