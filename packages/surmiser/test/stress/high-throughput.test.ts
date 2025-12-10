import { describe, it, expect } from 'vitest';
import { SurmiserEngine } from '../../src/engine';
import { localPredictive } from '../../src/defaults/provider';
import type { SuggestionContext } from '../../src/types';

describe('High Throughput Stress Test', () => {
  it('should handle rapid keystrokes without blocking', async () => {
    const provider = localPredictive([
      'hello world',
      'how are you',
      'testing performance',
    ]);
    const engine = new SurmiserEngine({
      providers: [provider],
      debounceMs: 200,
    });

    const iterations = 1000;
    const times: number[] = [];

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const iterStart = performance.now();

      const ctx: SuggestionContext = {
        text: 'hel',
        cursorPosition: 3,
        lastTokens: [],
      };

      engine.requestSuggestion(ctx);

      const iterEnd = performance.now();
      times.push(iterEnd - iterStart);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Calculate p95 of synchronous execution time
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];

    console.log(`Average sync time: ${totalTime / iterations}ms`);
    console.log(`P95 sync time: ${p95}ms`);

    // The synchronous part (setting timer) should be extremely fast (< 1ms usually)
    expect(p95).toBeLessThan(5);

    engine.destroy();
  });

  it('should process suggestions with low latency after debounce', async () => {
    const provider = localPredictive([
      'hello world',
      'how are you',
      'testing performance',
    ]);

    let suggestionReceived = false;
    let suggestionTime = 0;

    const engine = new SurmiserEngine({
      providers: [provider],
      debounceMs: 50, // Short debounce for testing
      onSuggestion: () => {
        suggestionReceived = true;
        suggestionTime = performance.now();
      },
    });

    const ctx: SuggestionContext = {
      text: 'hel',
      cursorPosition: 3,
      lastTokens: [],
    };

    const start = performance.now();
    engine.requestSuggestion(ctx);

    // Wait for debounce + processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(suggestionReceived).toBe(true);
    const latency = suggestionTime - start - 50; // Subtract debounce time

    console.log(`Suggestion processing latency: ${latency}ms`);

    // Latency should be low for small corpus
    expect(latency).toBeLessThan(50);

    engine.destroy();
  });
});
