import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SurmiserEngine } from '../src/engine';
import type { LocalProvider, SuggestionContext } from '../src/types';

describe('SurmiserEngine', () => {
  let mockProvider: LocalProvider;

  beforeEach(() => {
    vi.useFakeTimers();
    mockProvider = {
      id: 'mock',
      priority: 100,
      suggest: vi
        .fn()
        .mockResolvedValue({ completion: 'suggestion', confidence: 1 }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debounces requests by default 200ms', async () => {
    const engine = new SurmiserEngine({ providers: [mockProvider] });
    const ctx = {
      inputValue: 'te',
      cursorPosition: 2,
      lastTokens: [],
    } as SuggestionContext;

    // Trigger multiple requests rapidly
    engine.requestSuggestion(ctx);
    engine.requestSuggestion(ctx);
    engine.requestSuggestion(ctx);

    // Should not have called yet
    expect(mockProvider.suggest).not.toHaveBeenCalled();

    // Fast forward time just before 200ms
    await vi.advanceTimersByTimeAsync(150);
    expect(mockProvider.suggest).not.toHaveBeenCalled();

    // Fast forward past 200ms
    await vi.advanceTimersByTimeAsync(100);
    expect(mockProvider.suggest).toHaveBeenCalledTimes(1);
  });

  it('filters suggestions below confidence threshold', async () => {
    const lowConfProvider = {
      ...mockProvider,
      suggest: vi
        .fn()
        .mockResolvedValue({ completion: 'bad', confidence: 0.4 }),
    };

    const callback = vi.fn();
    const engine = new SurmiserEngine({
      providers: [lowConfProvider],
      minConfidence: 0.7, // Threshold is 0.7
      onSuggestion: callback,
    });

    engine.requestSuggestion({
      inputValue: 't',
      cursorPosition: 1,
      lastTokens: [],
    } as SuggestionContext);
    await vi.advanceTimersByTimeAsync(250);

    expect(lowConfProvider.suggest).toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalledWith(
      expect.objectContaining({ completion: 'bad' })
    );
    // Depending on implementation, it might call with null or not call at all.
    // Checking current suggestion state:
    expect(engine.getCurrentSuggestion()).toBeNull();
  });

  it('aborts stale requests on new input', async () => {
    const slowProvider = {
      ...mockProvider,
      suggest: vi.fn().mockImplementation((_ctx, _signal) => {
        return new Promise(() => {
          // Hold the promise indefinitely
          // This simulates a network request that is still pending
        });
      }),
    };

    const engine = new SurmiserEngine({
      providers: [slowProvider],
      debounceMs: 0,
    });
    const ctx1 = {
      inputValue: 'a',
      cursorPosition: 1,
      lastTokens: [],
    } as SuggestionContext;
    const ctx2 = {
      inputValue: 'ab',
      cursorPosition: 2,
      lastTokens: [],
    } as SuggestionContext;

    // 1. Trigger first request
    engine.requestSuggestion(ctx1);

    // 2. Allow debounce (0ms) to fire and fetchSuggestion to start
    await vi.advanceTimersByTimeAsync(1);

    // Now slowProvider.suggest should have been called once
    expect(slowProvider.suggest).toHaveBeenCalledTimes(1);

    // Check that the signal is NOT aborted yet
    const firstCallSignal = (slowProvider.suggest as any).mock.calls[0][1];
    expect(firstCallSignal.aborted).toBe(false);

    // 3. Trigger second request (should cancel the first one)
    engine.requestSuggestion(ctx2);

    // The first signal should now be aborted immediately
    expect(firstCallSignal.aborted).toBe(true);

    // 4. Allow second request to start
    await vi.advanceTimersByTimeAsync(1);

    // Provider should be called again
    expect(slowProvider.suggest).toHaveBeenCalledTimes(2);

    const secondCallSignal = (slowProvider.suggest as any).mock.calls[1][1];
    expect(secondCallSignal.aborted).toBe(false);
  });

  it('respects provider priority', async () => {
    const p1 = {
      ...mockProvider,
      id: 'low',
      priority: 1,
      suggest: vi.fn().mockResolvedValue(null),
    };
    const p2 = {
      ...mockProvider,
      id: 'high',
      priority: 100,
      suggest: vi.fn().mockResolvedValue({ completion: 'high', confidence: 1 }),
    };

    const engine = new SurmiserEngine({ providers: [p1, p2], debounceMs: 0 });

    engine.requestSuggestion({
      inputValue: '',
      cursorPosition: 0,
      lastTokens: [],
    } as SuggestionContext);

    // Allow debounce to fire
    await vi.advanceTimersByTimeAsync(1);

    // Should call high priority first
    expect(p2.suggest).toHaveBeenCalled();

    // Since p2 returned a good suggestion, p1 should NOT be called
    expect(p1.suggest).not.toHaveBeenCalled();
    expect(engine.getCurrentSuggestion()?.completion).toBe('high');
  });
});
