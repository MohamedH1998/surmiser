import { describe, it, expect } from 'vitest';
import { localPredictive } from '../../src/defaults/provider';
import { buildContext } from '../../src/context';

describe('Segment Boundary Tracking', () => {
  const corpus = ['take care', 'appreciate it', 'sounds good', 'thank you'];

  it('should suggest after marking segment boundary', async () => {
    const provider = localPredictive(corpus);
    let ctx = buildContext('ta', 2);
    let result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.completion).toBe('ke care');

    provider.markSegmentBoundary?.(2);

    // Use punctuation to reset segment
    ctx = buildContext('take care. tha', 14);
    result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    expect(result?.completion).toBe('nk you');
  });

  it('should handle multiple suggestions in same input', async () => {
    const provider = localPredictive(corpus);
    let ctx = buildContext('ta', 2);
    let result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();

    provider.markSegmentBoundary?.(2);

    // Use punctuation to reset
    ctx = buildContext('take care. app', 14);
    result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.completion).toBe('reciate it');

    // Accept -> "take care. appreciate it"
    provider.markSegmentBoundary?.(4);

    // Use punctuation to reset
    ctx = buildContext('take care. appreciate it. sou', 29);
    result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.completion).toBe('nds good');
  });

  it('should reset segment on punctuation', async () => {
    const provider = localPredictive(corpus);
    // Type "ta"
    let ctx = buildContext('ta', 2);
    let result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();

    // Accept -> "take care"
    provider.markSegmentBoundary?.(2);

    ctx = buildContext('take care. th', 13);
    result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    expect(result?.completion).toBe('ank you');
  });

  it('should respect context window limit', async () => {
    const provider = localPredictive(corpus);
    const longInput = 'one two three four five six seven eight ni';

    // With CONTEXT_WINDOW = 6, should only look at last 6 tokens
    const ctx = buildContext(longInput, longInput.length);
    const result = await provider.suggest(ctx, new AbortController().signal);

    // Should not match anything because no phrase starts with these tokens
    expect(result).toBeNull();
  });

  it('should not carry over bad context after boundary', async () => {
    const provider = localPredictive(corpus);

    let ctx = buildContext('weird', 5);
    let result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).toBeNull();

    provider.markSegmentBoundary?.(1);

    // Use punctuation to reset
    ctx = buildContext('weird! app', 10);
    result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.completion).toBe('reciate it');
  });
});
