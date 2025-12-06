export function tokenize(text: string): string[] {
  // Match words including apostrophes and hyphens
  // "i'm" → ["i'm"], "well-known" → ["well-known"]

  return text.toLowerCase().match(/[a-z0-9'-]+/gi) || [];
}

export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}
