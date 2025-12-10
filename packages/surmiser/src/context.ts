import type { SuggestionContext } from './types';

export function buildContext(
  value: string,
  cursorPos: number
): SuggestionContext {
  const beforeCursor = value.slice(0, cursorPos);
  const tokens = beforeCursor.toLowerCase().match(/\w+/g) || [];

  return {
    text: value,
    cursorPosition: cursorPos,
    lastTokens: tokens.slice(-3),
  };
}
