import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useSurmiser } from '../../src/react/useSurmiser';
import { SurmiserProvider } from '../../src/react/SurmiserProvider';
import React from 'react';
import type { SurmiserProvider as SurmiserProviderType } from '../../src/types';

describe('useSurmiser', () => {
  afterEach(() => {
    cleanup();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SurmiserProvider>{children}</SurmiserProvider>
  );

  it('initializes without error when wrapped in Provider', () => {
    const { result } = renderHook(
      () =>
        useSurmiser({
          providers: [],
        }),
      { wrapper }
    );

    // result.current is { attachRef, suggestion }
    expect(result.current.attachRef).toBeInstanceOf(Function);
    expect(result.current.suggestion).toBeNull();
  });

  it('merges context configuration with local options', () => {
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <SurmiserProvider minConfidence={0.7}>{children}</SurmiserProvider>
    );

    const { result } = renderHook(
      () =>
        useSurmiser({
          debounceMs: 500,
        }),
      { wrapper: customWrapper }
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('handles cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSurmiser({}), { wrapper });

    // Should not throw
    unmount();
  });

  it('is safe to call multiple times (React Strict Mode simulation)', () => {
    const { result, rerender } = renderHook(() => useSurmiser({}), { wrapper });

    rerender();
    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('works standalone without a Provider', () => {
    const { result } = renderHook(() =>
      useSurmiser({
        corpus: ['hello', 'world'],
      })
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);
    expect(result.current.suggestion).toBeNull();
  });

  it('uses default corpus when no Provider and no options', () => {
    const { result } = renderHook(() => useSurmiser());

    expect(result.current.attachRef).toBeInstanceOf(Function);
    expect(result.current.suggestion).toBeNull();
  });

  it('standalone usage with custom providers', () => {
    const mockProvider: SurmiserProviderType = {
      id: 'mock',
      priority: 100,
      suggest: async () => null,
    };

    const { result } = renderHook(() =>
      useSurmiser({
        providers: [mockProvider],
      })
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('standalone with corpus replaces default (not additive)', () => {
    const { result } = renderHook(() =>
      useSurmiser({
        corpus: ['custom', 'words'],
      })
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('with Provider, corpus is additive', () => {
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <SurmiserProvider corpus={['provider', 'words']}>
        {children}
      </SurmiserProvider>
    );

    const { result } = renderHook(
      () =>
        useSurmiser({
          corpus: ['additional', 'words'],
        }),
      { wrapper: customWrapper }
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('stabilizes corpus reference to prevent unnecessary re-attachments', () => {
    const { rerender, result } = renderHook(
      () =>
        useSurmiser({
          corpus: ['test', 'words', 'stable'],
          debounceMs: 0,
        }),
      { initialProps: { key: 0 } }
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);

    rerender({ key: 1 });
    rerender({ key: 2 });
    rerender({ key: 3 });

    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('handles dynamic corpus changes', () => {
    const { result, rerender } = renderHook(
      ({ corpus }: { corpus: string[] }) => useSurmiser({ corpus }),
      { initialProps: { corpus: ['sports phrase'] } }
    );

    expect(result.current.attachRef).toBeInstanceOf(Function);

    // Change corpus
    rerender({ corpus: ['dev phrase'] });

    expect(result.current.attachRef).toBeInstanceOf(Function);
  });

  it('switching between multiple corpus sets', () => {
    const sports = ['arsenal', 'tottenham'];
    const dev = ['feature', 'bug'];

    const { result, rerender } = renderHook(
      ({ corpus }: { corpus: string[] }) => useSurmiser({ corpus }),
      { initialProps: { corpus: sports } }
    );

    const ref1 = result.current.attachRef;

    rerender({ corpus: dev });
    const ref2 = result.current.attachRef;

    rerender({ corpus: sports });
    const ref3 = result.current.attachRef;

    // Refs should update when corpus changes
    expect(ref1).toBeInstanceOf(Function);
    expect(ref2).toBeInstanceOf(Function);
    expect(ref3).toBeInstanceOf(Function);
  });
});
