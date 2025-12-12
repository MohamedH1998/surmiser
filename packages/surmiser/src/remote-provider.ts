import { defaultPrompt } from './defaults/prompt';
import type {
  RemoteProviderConfig,
  RemoteSuggestionResponse,
  SuggestionContext,
  Suggestion,
  SurmiserProvider,
} from './types';

export function isRemoteProvider(
  p: SurmiserProvider
): p is RemoteProviderConfig {
  return (p as RemoteProviderConfig).endpoint !== undefined;
}

export async function fetchRemoteSuggestion(
  config: RemoteProviderConfig,
  ctx: SuggestionContext,
  signal: AbortSignal
): Promise<Suggestion | null> {
  const controller = new AbortController();
  const timeout = config.timeoutMs ?? 5000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers ?? {}),
      },
      body: JSON.stringify({
        text: ctx.text,
        cursor: ctx.cursorPosition,
        meta: config.meta,
        prompt: defaultPrompt({input: ctx.text}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(
        `Surmiser: remote provider ${config.id} returned ${res.status}`
      );
      return null;
    }

    const data = (await res.json()) as RemoteSuggestionResponse;

    if (!data?.suggestion) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Surmiser: remote provider ${config.id} returned no suggestion`,
          data
        );
      }
      return null;
    }

    return {
      text: data.suggestion,
      confidence: data.confidence,
      providerId: config.id,
    };
  } catch (err) {
    if (signal.aborted) {
      return null;
    }
    console.error(`Surmiser: remote provider ${config.id} failed:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
