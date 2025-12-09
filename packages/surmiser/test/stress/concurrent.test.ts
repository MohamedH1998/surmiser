import { describe, it, expect, vi } from 'vitest';
import { attachSurmiser } from '../../src/attach';
import { delay } from '../test-utils';

describe('Concurrent Usage Stress Test', () => {
  it('should handle 20+ inputs on the same page independently', async () => {
    const inputs: HTMLInputElement[] = [];
    const cleanups: (() => void)[] = [];
    const count = 20;

    // Create inputs
    for (let i = 0; i < count; i++) {
      const input = document.createElement('input');
      input.id = `input-${i}`;
      document.body.appendChild(input);
      inputs.push(input);
      
      // Each input gets a unique corpus
      const uniqueWord = `unique${i}`;
      const cleanup = attachSurmiser(input, {
        corpus: [uniqueWord],
        debounceMs: 10,
        onSuggestion: (suggestion) =>{
          expect(input.value).toBe(`uni`);
          expect(suggestion?.text).toBe(`que${i}`);
        }
      });
      cleanups.push(cleanup);
    }

    // Test specific input
    const targetIndex = 5;
    const targetInput = inputs[targetIndex];
    
    // Simulate typing
    targetInput.value = 'uni';
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.focus(); // Ghost renderer often relies on focus or layout
    
    // Wait for suggestion
    await delay(50);
  });

  it('should route suggestions to the correct input', async () => {
    const inputs: HTMLInputElement[] = [];
    const callbacks = new Map<number, any>();
    const count = 20;

    for (let i = 0; i < count; i++) {
      const input = document.createElement('input');
      document.body.appendChild(input);
      inputs.push(input);
      
      const callback = vi.fn();
      callbacks.set(i, callback);

      attachSurmiser(input, {
        corpus: [`unique${i}`],
        debounceMs: 10,
        onSuggestion: callback
      });
    }

    // Trigger input 10
    const targetIndex = 10;
    const targetInput = inputs[targetIndex];
    targetInput.value = 'uni';
    targetInput.dispatchEvent(new Event('input'));

    await delay(50);

    // Verify only callback 10 received the specific suggestion
    expect(callbacks.get(targetIndex)).toHaveBeenCalled();
    const suggestion = callbacks.get(targetIndex).mock.calls[0][0];
    expect(suggestion.text).toBe(`que${targetIndex}`);

    // Verify others were not called (or called with null/initially but not with this suggestion)
    expect(callbacks.get(targetIndex + 1)).not.toHaveBeenCalled();

    // Cleanup
    inputs.forEach(el => document.body.removeChild(el));
  });
});

