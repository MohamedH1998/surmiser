import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SurmiserInput } from '../../src/react/SurmiserInput';
import { SurmiserProvider } from '../../src/react/SurmiserProvider';
import React from 'react';

describe('SurmiserInput', () => {
  afterEach(() => {
    cleanup();
  });

  // Pattern 5: SurmiserInput - default corpus
  it('pattern 5: renders with default corpus', () => {
    const { container } = render(<SurmiserInput placeholder="Type..." />);

    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    expect(input?.placeholder).toBe('Type...');
  });

  // Pattern 6: SurmiserInput - custom corpus
  it('pattern 6: accepts custom corpus prop', () => {
    const customCorpus = ['sports phrase one', 'sports phrase two'];

    const { container } = render(
      <SurmiserInput corpus={customCorpus} placeholder="Sports..." />
    );

    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    expect(input?.placeholder).toBe('Sports...');
  });

  it('pattern 6: accepts custom providers', () => {
    const mockProvider = {
      id: 'mock',
      priority: 100,
      suggest: async () => null,
    };

    const { container } = render(
      <SurmiserInput providers={[mockProvider]} placeholder="Custom..." />
    );

    const input = container.querySelector('input');
    expect(input).toBeTruthy();
  });

  // Pattern 7: With Provider - inherited corpus
  it('pattern 7: works inside Provider with inherited corpus', () => {
    const { container } = render(
      <SurmiserProvider corpus={['provider corpus']}>
        <SurmiserInput placeholder="Type..." />
      </SurmiserProvider>
    );

    const input = container.querySelector('input');
    expect(input).toBeTruthy();
  });

  // Pattern 8: With Provider - additive corpus
  it('pattern 8: combines provider + local corpus', () => {
    const { container } = render(
      <SurmiserProvider corpus={['provider']}>
        <SurmiserInput corpus={['local']} placeholder="Type..." />
      </SurmiserProvider>
    );

    const input = container.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('handles controlled input value', () => {
    const { container } = render(
      <SurmiserInput value="hello" onChange={() => {}} placeholder="Type..." />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('forwards all standard input props', () => {
    const { container } = render(
      <SurmiserInput
        type="email"
        disabled
        className="custom-class"
        data-testid="test-input"
      />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('email');
    expect(input.disabled).toBe(true);
    expect(input.className).toContain('custom-class');
    expect(input.dataset.testid).toBe('test-input');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();

    render(<SurmiserInput ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
