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
      .mockResolvedValue({ completion: 'world', confidence: 1 });
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
        suggest: vi
          .fn()
          .mockResolvedValue({ completion: 'leted', confidence: 1 }),
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
      expect.objectContaining({ completion: 'leted' })
    );
    expect(input.value).toBe('completed');
  });

  it('accepts suggestion on ArrowRight at end of input', async () => {
    // Mock provider to return SUFFIX ('xt' for 'next')
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi.fn().mockResolvedValue({ completion: 'xt', confidence: 1 }),
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
        suggest: vi
          .fn()
          .mockResolvedValue({ completion: 'next', confidence: 1 }),
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
          .mockResolvedValue({ completion: 'dismiss-me', confidence: 1 }),
      },
    ];
    detach = attachSurmiser(input, options);

    input.value = 'dis';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Should have suggestion
    expect(options.onSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ completion: 'dismiss-me' })
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
          .mockResolvedValue({ completion: 'blur-test', confidence: 1 }),
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
        completion: 'so much',
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
    vi.fn().mockResolvedValue({ completion: ' you so much', confidence: 0.95 });

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
    expect(lastCall?.completion).toBeTruthy();
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
        completion: expect.any(String),
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

  it('hides suggestion when cursor moves away from end via click, requests fresh on return', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'llo world', confidence: 1 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const callCountAfterInput = suggestMock.mock.calls.length;

    // Click to move cursor to middle - hides suggestion
    input.selectionStart = 1;
    input.dispatchEvent(new Event('click', { bubbles: true }));

    // Click back to end - requests fresh suggestion
    input.selectionStart = 2;
    input.dispatchEvent(new Event('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 10));

    // Provider should have been called again (fresh request)
    expect(suggestMock.mock.calls.length).toBeGreaterThan(callCountAfterInput);
  });

  it('hides suggestion when cursor moves via arrow keys, requests fresh on return', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'llo world', confidence: 1 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const callCountAfterInput = suggestMock.mock.calls.length;

    // Press ArrowLeft to move cursor - hides
    input.selectionStart = 1;
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'ArrowLeft', bubbles: true })
    );

    // Press ArrowRight back to end - requests fresh
    input.selectionStart = 2;
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true })
    );
    await new Promise(r => setTimeout(r, 10));

    // Provider should have been called again
    expect(suggestMock.mock.calls.length).toBeGreaterThan(callCountAfterInput);
  });

  it('hides suggestion when Home key moves cursor, requests fresh when End returns', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'llo world', confidence: 1 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const callCountAfterInput = suggestMock.mock.calls.length;

    // Press Home to move cursor to start
    input.selectionStart = 0;
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Home', bubbles: true })
    );

    // Press End to return to end
    input.selectionStart = 2;
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'End', bubbles: true })
    );
    await new Promise(r => setTimeout(r, 10));

    // Provider should have been called again
    expect(suggestMock.mock.calls.length).toBeGreaterThan(callCountAfterInput);
  });

  it('does not clear suggestion when cursor at end via input', async () => {
    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: vi
          .fn()
          .mockResolvedValue({ completion: 'llo world', confidence: 1 }),
      },
    ];
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Should have suggestion and not clear it
    const suggestionCalls = (options.onSuggestion as ReturnType<typeof vi.fn>)
      .mock.calls;
    const lastSuggestion = suggestionCalls[suggestionCalls.length - 1][0];
    expect(lastSuggestion).not.toBeNull();
  });

  it('clears suggestion when text changes with cursor not at end', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'llo world', confidence: 1 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Move cursor to middle
    input.selectionStart = 1;

    // Type character in middle (changes text)
    input.value = 'hxe';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));

    // Should clear suggestion because text changed while cursor not at end
    expect(options.onSuggestion).toHaveBeenLastCalledWith(null);
  });

  it('avoids unnecessary renders when clicking at same position repeatedly', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'llo world', confidence: 1 });
    const onSuggestionSpy = vi.fn();
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    options.onSuggestion = onSuggestionSpy;
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const callCountAfterInput = onSuggestionSpy.mock.calls.length;

    // Click at end multiple times - should NOT trigger new onSuggestion calls
    input.dispatchEvent(new Event('click', { bubbles: true }));
    input.dispatchEvent(new Event('click', { bubbles: true }));
    input.dispatchEvent(new Event('click', { bubbles: true }));

    // onSuggestion should not have been called again (no state change)
    expect(onSuggestionSpy.mock.calls.length).toBe(callCountAfterInput);
  });

  it('avoids unnecessary renders when pressing arrows at same position', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'llo world', confidence: 1 });
    const onSuggestionSpy = vi.fn();
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    options.onSuggestion = onSuggestionSpy;
    detach = attachSurmiser(input, options);

    // Type and get suggestion
    input.value = 'he';
    input.selectionStart = 2;
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    const suggestCallsAfterInput = suggestMock.mock.calls.length;

    // Press End while already at end - should not trigger state change
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'End', bubbles: true })
    );

    // Provider should NOT have been called (no state change)
    expect(suggestMock.mock.calls.length).toBe(suggestCallsAfterInput);

    // Press End again - still no state change
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'End', bubbles: true })
    );

    // Provider should still NOT have been called
    expect(suggestMock.mock.calls.length).toBe(suggestCallsAfterInput);
  });
});
