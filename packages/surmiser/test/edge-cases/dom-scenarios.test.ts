import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachSurmiser } from '../../src/attach';
import type { SurmiserOptions, LocalProvider } from '../../src/types';

describe('DOM Scenarios Edge Cases', () => {
  let inputs: HTMLInputElement[] = [];
  let detachers: (() => void)[] = [];

  beforeEach(() => {
    inputs = [];
    detachers = [];
    document.body.innerHTML = '';
  });

  afterEach(() => {
    detachers.forEach(d => d());
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  const createInput = () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    inputs.push(input);
    return input;
  };

  const createOptions = (id: string): SurmiserOptions => ({
    providers: [
      {
        id: 'mock',
        priority: 1,
        suggest: vi
          .fn()
          .mockResolvedValue({ completion: `suggestion-${id}`, confidence: 1 }),
      },
    ],
    onSuggestion: vi.fn(),
    onAccept: vi.fn(),
    minConfidence: 0,
    debounceMs: 0,
  });

  it('handles multiple attached inputs independently', async () => {
    const input1 = createInput();
    const input2 = createInput();

    const options1 = createOptions('1');
    const options2 = createOptions('2');

    detachers.push(attachSurmiser(input1, options1));
    detachers.push(attachSurmiser(input2, options2));

    // Type in input 1
    input1.value = 'abc';
    input1.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 10));

    const providers1 = Array.isArray(options1.providers)
      ? options1.providers
      : [options1.providers!];
    const providers2 = Array.isArray(options2.providers)
      ? options2.providers
      : [options2.providers!];

    expect((providers1[0] as LocalProvider)?.suggest).toHaveBeenCalled();
    expect((providers2[0] as LocalProvider)?.suggest).not.toHaveBeenCalled();

    // Type in input 2
    input2.value = 'xyz';
    input2.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 10));

    expect((providers2[0] as LocalProvider)?.suggest).toHaveBeenCalled();
  });

  it('updates ghost position on scroll', async () => {
    const input = createInput();
    const options = createOptions('scroll');

    // Mock getBoundingClientRect
    const getRect = vi.fn().mockReturnValue({
      top: 100,
      left: 50,
      width: 200,
      height: 30,
    });
    input.getBoundingClientRect = getRect;

    detachers.push(attachSurmiser(input, options));

    // Initial sync
    expect(getRect).toHaveBeenCalled();
    const initialCalls = getRect.mock.calls.length;

    // Trigger scroll
    input.dispatchEvent(new Event('scroll'));

    // Should re-sync position (check if getBoundingClientRect is called again)
    expect(getRect.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('handles position: fixed inputs correctly', async () => {
    const input = createInput();
    const options = createOptions('fixed');

    // Mock styles to simulate position: fixed
    const originalGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation(el => {
      if (el === input) {
        return {
          ...originalGetComputedStyle(el),
          position: 'fixed',
          getPropertyValue: (prop: string) => {
            if (prop === 'position') return 'fixed';
            return originalGetComputedStyle(el).getPropertyValue(prop);
          },
        } as any;
      }
      return originalGetComputedStyle(el);
    });

    const getRect = vi.fn().mockReturnValue({
      top: 100,
      left: 50,
      width: 200,
      height: 30,
    });
    input.getBoundingClientRect = getRect;

    detachers.push(attachSurmiser(input, options));

    // Wait for microtasks (syncStyles is called in constructor)
    await new Promise(r => setTimeout(r, 10));

    // Find div with z-index 9999
    const ghost = Array.from(document.body.children).find(
      el => (el as HTMLElement).style?.zIndex === '9999'
    ) as HTMLElement;

    expect(ghost).toBeDefined();
    expect(ghost.style.position).toBe('fixed');
    expect(ghost.style.top).toBe('100px'); // Matches rect.top directly for fixed
  });

  it('cleans up all created elements on detach', () => {
    const input = createInput();
    const options = createOptions('cleanup');

    const initialBodyChildren = document.body.children.length; // Just the input

    const detach = attachSurmiser(input, options);
    detachers.push(detach); // In case test fails

    // Attach creates ghost and live region
    expect(document.body.children.length).toBeGreaterThan(initialBodyChildren);

    // Detach
    detach();
    detachers.pop(); // Remove from auto-cleanup list since we called it

    // Should be back to initial state (only input remaining)
    expect(document.body.children.length).toBe(initialBodyChildren);
  });
});
