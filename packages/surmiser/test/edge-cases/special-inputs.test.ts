import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachSurmiser } from '../../src/attach';
import type { SurmiserOptions } from '../../src/types';

describe('Special Inputs Edge Cases', () => {
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
      debounceMs: 0,
    };
  });

  afterEach(() => {
    if (detach) detach();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('handles emoji input correctly', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: '👋 world', confidence: 1 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];

    detach = attachSurmiser(input, options);

    // Simulate typing "hello 👋"
    input.value = 'hello 👋';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 10));

    expect(suggestMock).toHaveBeenCalledWith(
      expect.objectContaining({ inputValue: 'hello 👋' }),
      expect.anything()
    );
  });

  it('handles pasting large text gracefully', async () => {
    const suggestMock = vi
      .fn()
      .mockResolvedValue({ completion: 'ignored', confidence: 1 });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    detach = attachSurmiser(input, options);

    // Create large text
    const largeText = 'a'.repeat(5000);
    input.value = largeText;

    // Simulate paste event
    const pasteEvent = new InputEvent('input', {
      inputType: 'insertFromPaste',
      bubbles: true,
      data: largeText,
    });
    input.dispatchEvent(pasteEvent);

    await new Promise(r => setTimeout(r, 10));

    // Even large text should trigger suggestion logic
    expect(suggestMock).toHaveBeenCalled();
  });

  it('clears suggestions on select-all and delete', async () => {
    // Mock that returns null if text is empty
    const suggestMock = vi.fn().mockImplementation(async ctx => {
      if (!ctx.inputValue) return null;
      return { completion: 'suggestion', confidence: 1 };
    });

    options.providers = [
      {
        id: 'mock',
        priority: 1,
        suggest: suggestMock,
      },
    ];
    detach = attachSurmiser(input, options);

    // Start with some text
    input.value = 'some text';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Check we got a suggestion
    expect(options.onSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ completion: 'suggestion' })
    );

    // Select all and delete (empty input)
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 10));

    // Should clear suggestion
    expect(options.onSuggestion).toHaveBeenLastCalledWith(null);
  });

  it('handles browser autofill simulation', async () => {
    const suggestMock = vi.fn().mockResolvedValue({
      completion: 'autofilled-completion',
      confidence: 1,
    });
    options.providers = [{ id: 'mock', priority: 1, suggest: suggestMock }];
    detach = attachSurmiser(input, options);

    // Simulate autofill
    input.value = 'myuser';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 10));

    expect(suggestMock).toHaveBeenCalledWith(
      expect.objectContaining({ inputValue: 'myuser' }),
      expect.anything()
    );
  });
});
