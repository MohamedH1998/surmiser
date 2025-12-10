import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Helper to delay (for testing debouncing)
export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock Suggestion Context builder
export const mockContext = (text: string) => ({
  text,
  cursor: text.length,
  language: 'plaintext',
});
