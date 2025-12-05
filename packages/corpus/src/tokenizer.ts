// Tokenizer - will implement in Phase 5
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\w+/g) || []
}

export function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}
