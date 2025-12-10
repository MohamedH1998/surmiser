import { describe, it, expect } from 'vitest';
import { localPredictive } from '../../src/defaults/provider';
import { buildContext } from '../../src/context';

describe('Context Discard Protection', () => {
  const provider = localPredictive([
    'long time no see',
    'appreciate it',
    'take care',
    'app store',
  ]);

  it('should NOT suggest "appreciate it" for "long t a"', async () => {
    const ctx = buildContext('long t a', 8);
    const result = await provider.suggest(ctx);

    // Should not match because:
    // - Would need to discard 2 tokens (long, t) and match only "a"
    // - "a" is < 3 chars in multi-word context
    expect(result).toBeNull();
  });

  it('should still suggest "take care" for "ta"', async () => {
    const ctx = buildContext('ta', 2);
    const result = await provider.suggest(ctx);

    // Should match because it's standalone (not multi-word)
    expect(result).not.toBeNull();
    expect(result?.text).toBe('ke care');
  });

  it('should suggest "appreciate it" for "long app"', async () => {
    const ctx = buildContext('long app', 8);
    const result = await provider.suggest(ctx);

    // Should match because:
    // - Discards only 1 token ("long")
    // - "app" is >= 3 chars
    expect(result).not.toBeNull();
    expect(result?.text).toBe('reciate it');
  });

  it('should suggest "app store" for "a"', async () => {
    const ctx = buildContext('a', 1);
    const result = await provider.suggest(ctx);

    // Should match because it's standalone (not multi-word)
    expect(result).not.toBeNull();
    expect(result?.text).toContain('pp');
  });

  it('should NOT suggest for "some phrase i"', async () => {
    const ctx = buildContext('some phrase i', 13);
    const result = await provider.suggest(ctx);

    // "i" is too short in multi-word context
    expect(result).toBeNull();
  });
});
