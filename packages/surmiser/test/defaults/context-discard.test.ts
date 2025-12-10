import { describe, it, expect } from 'vitest';
import { localPredictive } from '../../src/defaults/provider';
import { buildContext } from '../../src/context';

describe('Context Discard Protection', () => {
  const corpus = [
    'long time no see',
    'appreciate it',
    'take care',
    'app store',
  ];

  it('should NOT suggest "appreciate it" for "long t a"', async () => {
    const provider = localPredictive(corpus);
    const ctx = buildContext('long t a', 8);
    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).toBeNull();
  });

  it('should still suggest "take care" for "ta"', async () => {
    const provider = localPredictive(corpus);
    const ctx = buildContext('ta', 2);
    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    expect(result?.text).toBe('ke care');
  });

  it('should NOT suggest for "long app" (multi-word segment)', async () => {
    const provider = localPredictive(corpus);
    const ctx = buildContext('long app', 8);
    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).toBeNull();
  });

  it('should suggest for "ap" (2+ chars, matches appreciate)', async () => {
    const provider = localPredictive(corpus);
    const ctx = buildContext('ap', 2);
    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).not.toBeNull();
    expect(result?.text).toBe('preciate it');
  });

  it('should NOT suggest for "some phrase i"', async () => {
    const provider = localPredictive(corpus);
    const ctx = buildContext('some phrase i', 13);
    const result = await provider.suggest(ctx, new AbortController().signal);

    expect(result).toBeNull();
  });
});
