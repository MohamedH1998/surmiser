export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

export function tokenize(text: string): string[] {
  if (!text) return [];

  const rawTokens =
    // eslint-disable-next-line no-useless-escape
    text.match(/[a-z0-9]+(?:['’-][a-z0-9]+)*|[.,!?;:(){}\[\]…—–-]+/gi) || [];

  const tokens: string[] = [];

  for (const raw of rawTokens) {
    const token = raw.toLowerCase();

    const isPunctuationGroup = /^[.,!?;:…]+$/.test(token);
    const hasPrevious = tokens.length > 0;
    const prev = hasPrevious ? tokens[tokens.length - 1] : '';
    const prevEndsWithWordChar = /[a-z0-9]$/i.test(prev);

    if (isPunctuationGroup && hasPrevious && prevEndsWithWordChar) {
      tokens[tokens.length - 1] = prev + token;
    } else {
      tokens.push(token);
    }
  }

  return tokens;
}
