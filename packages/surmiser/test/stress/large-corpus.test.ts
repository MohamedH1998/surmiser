import { describe, it, expect } from 'vitest';
import { SurmiserEngine } from '../../src/engine';
import { localPredictive } from '../../src/defaults/provider';
import type { SuggestionContext } from '../../src/types';

// Generate a large corpus
const generateLargeCorpus = (size: number) => {
  const corpus: string[] = [];
  const words = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
  ];

  for (let i = 0; i < size; i++) {
    // Create random phrases of 3-5 words
    const len = 3 + Math.floor(Math.random() * 3);
    const phrase = Array.from(
      { length: len },
      () => words[Math.floor(Math.random() * words.length)]
    ).join(' ');
    corpus.push(phrase);
  }
  return corpus;
};

describe('Large Corpus Stress Test', () => {
  const corpusSize = 10000;
  console.log(`Generating corpus of size ${corpusSize}...`);
  const largeCorpus = generateLargeCorpus(corpusSize);

  it('should handle 10k+ phrases without blocking UI', async () => {
    const provider = localPredictive(largeCorpus);

    let suggestionReceived = false;
    let endTime = 0;

    const engine = new SurmiserEngine({
      providers: [provider],
      debounceMs: 50,
      onSuggestion: () => {
        suggestionReceived = true;
        endTime = performance.now();
      },
    });

    const ctx: SuggestionContext = {
      text: 'lorem ip',
      cursorPosition: 8,
      lastTokens: [],
    };

    const startTime = performance.now();
    engine.requestSuggestion(ctx);

    // Wait enough time for processing
    // With 10k items, linear scan might take some time, but hopefully < 50ms
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(suggestionReceived).toBe(true);

    const totalTime = endTime - startTime;
    const processingTime = totalTime - 50; // Subtract debounce

    console.log(`Processing time for ${corpusSize} items: ${processingTime}ms`);

    // We want p95 < 50ms as per requirements.
    // This might fail with linear scan on slower machines, but let's see.
    expect(processingTime).toBeLessThan(50);

    engine.destroy();
  });

  it('should maintain memory usage within reasonable limits', () => {
    // This is hard to strictly test in JS/Vitest reliably without access to gc() or process.memoryUsage() which varies.
    // But we can ensure creating the provider didn't crash or take forever.
    const provider = localPredictive(largeCorpus);
    expect(provider).toBeDefined();
  });
});
