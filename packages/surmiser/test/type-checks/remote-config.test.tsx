import { describe, it, expect } from 'vitest';
import { attachSurmiser } from '../../src/attach';
import { useSurmiser } from '../../src/react/useSurmiser';
import { SurmiserProvider } from '../../src/react/SurmiserProvider';
import type { RemoteProviderConfig } from '../../src/types';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';

describe('Remote Config Type Compatibility', () => {
  const remoteConfig: RemoteProviderConfig = {
    id: 'ai',
    endpoint: '/api/suggest',
    priority: 100,
  };

  it('accepts remote config in attachSurmiser', () => {
    const input = document.createElement('input');

    // Should compile without TS errors
    const detach = attachSurmiser(input, {
      providers: [remoteConfig],
    });

    expect(detach).toBeTypeOf('function');
    detach();
  });

  it('accepts remote config in useSurmiser', () => {
    // Should compile without TS errors
    const { result } = renderHook(() =>
      useSurmiser({
        providers: [remoteConfig],
      })
    );

    expect(result.current.attachRef).toBeTypeOf('function');
  });

  it('accepts remote config in SurmiserProvider (single)', () => {
    // Should compile without TS errors
    const element = createElement(SurmiserProvider, {
      providers: remoteConfig,
      children: createElement('div', null, 'Test'),
    });

    expect(element).toBeTruthy();
  });

  it('accepts remote config in SurmiserProvider (array)', () => {
    // Should compile without TS errors
    const element = createElement(SurmiserProvider, {
      providers: [remoteConfig],
      children: createElement('div', null, 'Test'),
    });

    expect(element).toBeTruthy();
  });

  it('accepts remote config with all optional fields', () => {
    const fullConfig: RemoteProviderConfig = {
      id: 'ai-full',
      endpoint: '/api/suggest',
      priority: 100,
      timeoutMs: 3000,
      headers: { 'X-Custom': 'value' },
      meta: { domain: 'email', tone: 'formal' },
    };

    const input = document.createElement('input');
    const detach = attachSurmiser(input, {
      providers: [fullConfig],
    });

    expect(detach).toBeTypeOf('function');
    detach();
  });

  it('accepts mixed local and remote providers', () => {
    const localProvider = {
      id: 'local',
      priority: 10,
      suggest: async () => ({
        completion: 'test',
        confidence: 0.75,
        providerId: 'local',
      }),
    };

    const input = document.createElement('input');
    const detach = attachSurmiser(input, {
      providers: [localProvider, remoteConfig],
    });

    expect(detach).toBeTypeOf('function');
    detach();
  });
});
