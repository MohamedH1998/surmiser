import { describe, it, expect } from 'vitest';
import { localPredictive } from '../../src/defaults/provider';

describe('localPredictive Provider', () => {
  it('matches prefix from corpus', async () => {
    const provider = localPredictive(['hello world', 'hello universe']);
    const ctx = {
      inputValue: 'hello ',
      cursorPosition: 6,
      lastTokens: ['hello', ''],
    };

    // Should match "world" or "universe" - likely first match or shortest
    // Implementation logic: iterates and finds best match.
    // If input is "hello ", matches "hello world", returns "world".
    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    // Assuming it returns the suffix
    expect(['world', 'universe']).toContain(result?.completion);
  });

  it('handles empty corpus', async () => {
    const provider = localPredictive([]);
    const ctx = {
      inputValue: 'hello',
      cursorPosition: 5,
      lastTokens: ['hello'],
    };

    const result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).toBeNull();
  });

  it('handles mid-sentence prediction', async () => {
    const provider = localPredictive(['git commit', 'git push']);
    // Typing "git co"
    const ctx = {
      inputValue: 'git co',
      cursorPosition: 6,
      lastTokens: ['git', 'co'],
    };

    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    // "git commit" - "git co" = "mmit"
    expect(result?.completion).toBe('mmit');
  });

  it('returns null if no match found', async () => {
    const provider = localPredictive(['apple', 'banana']);
    const ctx = {
      inputValue: 'cherr',
      cursorPosition: 5,
      lastTokens: ['cherr'],
    };

    const result = await provider.suggest(ctx, new AbortController().signal);
    expect(result).toBeNull();
  });

  it('handles trailing comma without duplication', async () => {
    const provider = localPredictive(['hello, world']);
    // User types "hello,"
    const ctx = {
      inputValue: 'hello,',
      cursorPosition: 6,
      lastTokens: ['hello'],
    };

    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    // Should return " world" NOT ", world" (comma already typed)
    expect(result?.completion).toBe(' world');
  });

  it('handles trailing comma with space', async () => {
    const provider = localPredictive(['hello, world']);
    // User types "hello, "
    const ctx = {
      inputValue: 'hello, ',
      cursorPosition: 7,
      lastTokens: ['hello'],
    };

    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    // Should return "world" (comma and space already typed)
    expect(result?.completion).toBe('world');
  });
});
