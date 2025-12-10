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
      debounceMs: 0,
    };
  });

  afterEach(() => {
    if (detach) detach();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('triggers suggestion flow on input', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ text: 'world', confidence: 100 });
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
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi.fn().mockResolvedValue({ text: 'leted', confidence: 100 }),
      },
    ];

    detach = attachSurmiser(input, options);

    // Trigger suggestion
    input.value = 'comp';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Simulate Tab
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
    // onAccept calls with the suggestion object, so it receives 'leted'
    expect(options.onAccept).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'leted' })
    );
    expect(input.value).toBe('completed');
  });

  it('accepts suggestion on ArrowRight at end of input', async () => {
    // Mock provider to return SUFFIX ('xt' for 'next')
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi.fn().mockResolvedValue({ text: 'xt', confidence: 100 }),
      },
    ];
    detach = attachSurmiser(input, options);

    input.value = 'ne';
    input.selectionStart = 2; // End of input
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const arrowEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(arrowEvent);

    expect(arrowEvent.defaultPrevented).toBe(true);
    expect(input.value).toBe('next');
  });

  it('does NOT accept ArrowRight if cursor is not at end', async () => {
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi.fn().mockResolvedValue({ text: 'next', confidence: 100 }),
      },
    ];
    detach = attachSurmiser(input, options);

    input.value = 'ne';
    input.selectionStart = 1; // Middle of input
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const arrowEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(arrowEvent);

    expect(arrowEvent.defaultPrevented).toBe(false);
    expect(input.value).toBe('ne');
  });

  it('dismisses suggestion on Escape', async () => {
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi
          .fn()
          .mockResolvedValue({ text: 'dismiss-me', confidence: 100 }),
      },
    ];
    detach = attachSurmiser(input, options);

    input.value = 'dis';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Should have suggestion
    expect(options.onSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'dismiss-me' })
    );

    // Press Escape
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    // Should clear suggestion (we check if onSuggestion called with null)
    expect(options.onSuggestion).toHaveBeenLastCalledWith(null);
  });

  it('clears suggestions on blur', async () => {
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi
          .fn()
          .mockResolvedValue({ text: 'blur-test', confidence: 100 }),
      },
    ];
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
    expect(removeSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      true
    );
    expect(removeSpy).toHaveBeenCalledWith('blur', expect.any(Function), true);
  });

  it('works with custom corpus without explicit provider', async () => {
    const customCorpus = [
      'thank you so much',
      'thanks for letting me know',
      'that sounds great',
    ];

    const corpusOptions: SurmiserOptions = {
      corpus: customCorpus,
      onSuggestion: vi.fn(),
      onAccept: vi.fn(),
      debounceMs: 0,
      minConfidence: 0,
    };

    detach = attachSurmiser(input, corpusOptions);

    input.value = 'thank you ';
    input.selectionStart = 10;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));

    expect(corpusOptions.onSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'so much',
        confidence: expect.any(Number),
      })
    );

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
    expect(input.value).toBe('thank you so much');
    expect(corpusOptions.onAccept).toHaveBeenCalled();
  });

  it('throws error when both corpus and providers are specified', () => {
    const invalidOptions: SurmiserOptions = {
      corpus: ['test'],
      providers: [{ id: 'test', priority: 1, suggest: vi.fn() }],
    };

    expect(() => {
      attachSurmiser(input, invalidOptions);
    }).toThrow("Cannot use both 'corpus' and 'providers'");
  });

  it('handles multiple rapid inputs without losing suggestions', async () => {
    vi.fn().mockResolvedValue({ text: ' you so much', confidence: 95 });

    const corpusOptions: SurmiserOptions = {
      corpus: ['thank you so much'],
      onSuggestion: vi.fn(),
      debounceMs: 0,
      minConfidence: 0,
    };

    detach = attachSurmiser(input, corpusOptions);

    input.value = 't';
    input.selectionStart = 1;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    input.value = 'th';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    input.value = 'tha';
    input.selectionStart = 3;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    input.value = 'than';
    input.selectionStart = 4;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    input.value = 'thank';
    input.selectionStart = 5;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 50));

    const calls = (corpusOptions.onSuggestion as ReturnType<typeof vi.fn>).mock
      .calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).not.toBeNull();
    expect(lastCall?.text).toBeTruthy();
  });

  it('works with default options', async () => {
    const onSuggestion = vi.fn();

    detach = attachSurmiser(input, { onSuggestion, debounceMs: 0 });

    input.value = 'thank you ';
    input.selectionStart = 10;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));

    expect(onSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.any(String),
        confidence: expect.any(Number),
      })
    );
  });

  it('attaches with completely empty options (full default)', async () => {
    const onSuggestion = vi.fn();

    detach = attachSurmiser(input, {
      onSuggestion,
      debounceMs: 0,
      minConfidence: 0,
    });

    input.value = 'thanks ';
    input.selectionStart = 7;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 20));

    expect(onSuggestion).toHaveBeenCalled();
  });

  it('works when options param is undefined', () => {
    expect(() => {
      detach = attachSurmiser(input);
    }).not.toThrow();
  });

  it('works when options param is empty object', () => {
    expect(() => {
      detach = attachSurmiser(input, {});
    }).not.toThrow();
  });
});
