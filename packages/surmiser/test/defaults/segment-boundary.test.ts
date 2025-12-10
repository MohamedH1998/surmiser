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
    expect(result?.text).toBe('ke care');

    provider.markSegmentBoundary?.(2);

    ctx = buildContext('take care th', 12);
    result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    expect(result?.text).toBe('ank you');
  });

  it('should handle multiple suggestions in same input', async () => {
    const provider = localPredictive(corpus);
    let ctx = buildContext('ta', 2);
    let result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();

    provider.markSegmentBoundary?.(2);

    // Type " ap"
    ctx = buildContext('take care ap', 12);
    result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.text).toBe('preciate it');

    // Accept -> "take care appreciate it"
    provider.markSegmentBoundary?.(4);

    // Type " so"
    ctx = buildContext('take care appreciate it so', 27);
    result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.text).toBe('unds good');
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
    expect(result?.text).toBe('ank you');
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

    // Mark boundary at "weird" (1 token) - simulate accepting something
    provider.markSegmentBoundary?.(1);

    ctx = buildContext('weird ap', 8);
    result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).not.toBeNull();
    expect(result?.text).toBe('preciate it');
  });
});
