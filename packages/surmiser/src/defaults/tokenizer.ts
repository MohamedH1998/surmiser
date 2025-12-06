export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9'-]+/gi) || [];
}

export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}
