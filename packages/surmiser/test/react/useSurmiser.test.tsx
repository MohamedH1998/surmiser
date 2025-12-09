import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useSurmiser } from '../../src/react/useSurmiser';
import { SurmiserProvider } from '../../src/react/SurmiserProvider';
import React from 'react';

describe('useSurmiser', () => {
  afterEach(() => {
    cleanup();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SurmiserProvider>{children}</SurmiserProvider>
  );

  it('initializes without error when wrapped in Provider', () => {
    const { result } = renderHook(() => useSurmiser({
      providers: []
    }), { wrapper });
    
    // result.current is { attachRef, suggestion }
    expect(result.current.attachRef).toBeInstanceOf(Function);
    expect(result.current.suggestion).toBeNull();
  });

  it('merges context configuration with local options', () => {
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <SurmiserProvider minConfidence={80}>
        {children}
      </SurmiserProvider>
    );

    const { result } = renderHook(() => useSurmiser({
      debounceMs: 500
    }), { wrapper: customWrapper });

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
});

