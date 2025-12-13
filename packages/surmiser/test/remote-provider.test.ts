import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SurmiserEngine } from '../src/engine';
import {
  isRemoteProvider,
  fetchRemoteSuggestion,
} from '../src/remote-provider';
import type { RemoteProviderConfig, SuggestionContext } from '../src/types';

describe('Remote Provider', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isRemoteProvider', () => {
    it('identifies remote provider by endpoint field', () => {
      const remote: RemoteProviderConfig = {
        id: 'test-remote',
        endpoint: '/api/suggest',
      };

      const local = {
        id: 'test-local',
        priority: 10,
        suggest: vi.fn(),
      };

      expect(isRemoteProvider(remote)).toBe(true);
      expect(isRemoteProvider(local)).toBe(false);
    });
  });

  describe('fetchRemoteSuggestion', () => {
    const ctx: SuggestionContext = {
      text: 'hello',
      cursorPosition: 5,
      lastTokens: ['hello'],
    };

    it('makes POST request with correct payload', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestion: ' world',
          confidence: 0.9,
        }),
      });

      const signal = new AbortController().signal;
      await fetchRemoteSuggestion(config, ctx, signal);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/suggest',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"text":"hello"'),
          signal: expect.any(AbortSignal),
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.text).toBe('hello');
      expect(callBody.cursor).toBe(5);
      expect(callBody.meta).toBeUndefined();
      expect(callBody.prompt).toBeDefined();
    });

    it('includes custom headers and meta', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
        headers: { 'X-Custom': 'value' },
        meta: { domain: 'email' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestion: ' world',
          confidence: 0.9,
        }),
      });

      const signal = new AbortController().signal;
      await fetchRemoteSuggestion(config, ctx, signal);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/suggest',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'value',
          }),
          body: expect.stringContaining('"text":"hello"'),
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.text).toBe('hello');
      expect(callBody.cursor).toBe(5);
      expect(callBody.meta).toEqual({ domain: 'email' });
      expect(callBody.prompt).toBeDefined();
    });

    it('returns suggestion on success', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestion: ' world',
          confidence: 0.9,
        }),
      });

      const signal = new AbortController().signal;
      const result = await fetchRemoteSuggestion(config, ctx, signal);

      expect(result).toEqual({
        text: ' world',
        confidence: 0.9,
        providerId: 'test',
      });
    });

    it('returns null on HTTP error', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const signal = new AbortController().signal;
      const result = await fetchRemoteSuggestion(config, ctx, signal);

      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      const signal = new AbortController().signal;
      const result = await fetchRemoteSuggestion(config, ctx, signal);

      expect(result).toBeNull();
    });

    it('returns null when suggestion is empty', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestion: '',
          confidence: 0.9,
        }),
      });

      const signal = new AbortController().signal;
      const result = await fetchRemoteSuggestion(config, ctx, signal);

      expect(result).toBeNull();
    });

    it('handles abort signal', async () => {
      const config: RemoteProviderConfig = {
        id: 'test',
        endpoint: '/api/suggest',
      };

      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValue(new Error('Aborted'));

      const result = await fetchRemoteSuggestion(
        config,
        ctx,
        controller.signal
      );

      expect(result).toBeNull();
    });
  });

  describe('Engine integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('works with remote provider in engine', async () => {
      const remoteConfig: RemoteProviderConfig = {
        id: 'remote',
        priority: 100,
        endpoint: '/api/suggest',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestion: ' from remote',
          confidence: 95,
        }),
      });

      const onSuggestion = vi.fn();
      const engine = new SurmiserEngine({
        providers: [remoteConfig],
        onSuggestion,
        debounceMs: 0,
      });

      const ctx: SuggestionContext = {
        text: 'hello',
        cursorPosition: 5,
        lastTokens: ['hello'],
      };

      engine.requestSuggestion(ctx);

      await vi.advanceTimersByTimeAsync(1);

      expect(onSuggestion).toHaveBeenCalledWith({
        text: ' from remote',
        confidence: 95,
        providerId: 'remote',
      });
    });

    it('falls back to local when remote fails', async () => {
      const remoteConfig: RemoteProviderConfig = {
        id: 'remote',
        priority: 100,
        endpoint: '/api/suggest',
      };

      const localProvider = {
        id: 'local',
        priority: 10,
        suggest: vi.fn().mockResolvedValue({
          text: ' from local',
          confidence: 75,
          providerId: 'local',
        }),
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const onSuggestion = vi.fn();
      const engine = new SurmiserEngine({
        providers: [remoteConfig, localProvider],
        onSuggestion,
        debounceMs: 0,
      });

      const ctx: SuggestionContext = {
        text: 'hello',
        cursorPosition: 5,
        lastTokens: ['hello'],
      };

      engine.requestSuggestion(ctx);

      await vi.advanceTimersByTimeAsync(1);

      expect(onSuggestion).toHaveBeenCalledWith({
        text: ' from local',
        confidence: 75,
        providerId: 'local',
      });
    });

    it('sorts by priority (remote higher than local)', async () => {
      const remoteConfig: RemoteProviderConfig = {
        id: 'remote',
        priority: 100,
        endpoint: '/api/suggest',
      };

      const localProvider = {
        id: 'local',
        priority: 10,
        suggest: vi.fn().mockResolvedValue({
          text: ' from local',
          confidence: 75,
          providerId: 'local',
        }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestion: ' from remote',
          confidence: 95,
        }),
      });

      const onSuggestion = vi.fn();
      const engine = new SurmiserEngine({
        providers: [localProvider, remoteConfig],
        onSuggestion,
        debounceMs: 0,
      });

      const ctx: SuggestionContext = {
        text: 'hello',
        cursorPosition: 5,
        lastTokens: ['hello'],
      };

      engine.requestSuggestion(ctx);

      await vi.advanceTimersByTimeAsync(1);

      // Should use remote (higher priority) not local
      expect(onSuggestion).toHaveBeenCalledWith({
        text: ' from remote',
        confidence: 95,
        providerId: 'remote',
      });

      // Local should not even be called since remote returned >= 95 confidence
      expect(localProvider.suggest).not.toHaveBeenCalled();
    });
  });
});
