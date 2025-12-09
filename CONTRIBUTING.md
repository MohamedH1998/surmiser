# Contributing to Surmiser

Thank you for your interest in contributing to Surmiser! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please:

- Be respectful and constructive in discussions
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (we use pnpm workspaces)
- **Git**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/surmiser.git
cd surmiser
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/MohamedH1998/surmiser.git
```

---

## Development Setup

### Install Dependencies

```bash
# Install all dependencies for the monorepo
pnpm install
```

### Build the Package

```bash
# Build all packages
pnpm build

# Or build just the surmiser package
cd packages/surmiser
pnpm build
```

### Run Tests

```bash
# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test

# Run unit tests once (CI mode)
cd packages/surmiser
pnpm test:run

# Run E2E tests with Playwright
cd packages/surmiser
npx playwright test

# Run E2E tests with UI
npx playwright test --ui
```

### Run Playground

```bash
cd examples/playground
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to see the playground.

---

## Project Structure

```
surmiser/
├── packages/
│   └── surmiser/              # Main package
│       ├── src/
│       │   ├── attach.ts      # Core attachment logic
│       │   ├── engine.ts      # Suggestion engine
│       │   ├── renderer.ts    # Ghost text renderer
│       │   ├── types.ts       # TypeScript types
│       │   ├── context.ts     # Shared context utilities
│       │   ├── defaults/      # Default corpus & provider
│       │   ├── react/         # React bindings
│       │   └── corpora/       # Pre-built corpora (future)
│       ├── test/              # Unit tests (Vitest)
│       │   ├── engine.test.ts
│       │   ├── attach.test.ts
│       │   ├── accessibility/
│       │   ├── edge-cases/
│       │   └── stress/
│       ├── e2e/               # E2E tests (Playwright)
│       │   ├── basic-flow.spec.ts
│       │   ├── mobile-gestures.spec.ts
│       │   └── ime-composition.spec.ts
│       ├── dist/              # Build output
│       └── package.json
├── examples/
│   └── playground/            # Interactive playground
├── docs/
│   └── API.md                 # API documentation
├── CHANGELOG.md               # Version history
├── CONTRIBUTING.md            # This file
└── SECURITY.md                # Security policy
```

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### 2. Make Changes

- Write code following our [Code Style](#code-style)
- Add tests for new functionality
- Update documentation if needed
- Ensure all tests pass

### 3. Commit Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add custom corpus support"
git commit -m "fix: ghost text positioning on mobile"
git commit -m "docs: update API examples"
git commit -m "test: add edge case for emoji input"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, etc.
- `perf:` - Performance improvements

### 4. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

---

## Testing

We maintain high test coverage with unit tests (Vitest) and E2E tests (Playwright).

### Writing Unit Tests

Place tests in `packages/surmiser/test/` directory.

**Example:**

```typescript
import { describe, it, expect } from "vitest";
import { attachSurmiser } from "../src/attach";
import { createTestInput } from "./test-utils";

describe("attachSurmiser", () => {
  it("should attach to input element", () => {
    const input = createTestInput();
    const detach = attachSurmiser(input);

    // Your test assertions
    expect(input.getAttribute("aria-autocomplete")).toBe("inline");

    detach();
  });
});
```

### Writing E2E Tests

Place tests in `packages/surmiser/e2e/` directory.

**Example:**

```typescript
import { test, expect } from "@playwright/test";

test("should show suggestion on typing", async ({ page }) => {
  await page.goto("/");
  
  const input = page.locator('input[type="text"]');
  await input.fill("tha");
  
  const ghost = page.locator(".surmiser-ghost");
  await expect(ghost).toContainText("thanks");
});
```

### Test Categories

Our tests follow the structure from `testing-plan.md`:

1. **Core Tests** (`test/`)
   - `engine.test.ts` - Suggestion engine logic
   - `attach.test.ts` - DOM attachment and keyboard controls
   - `defaults/provider.test.ts` - Default corpus matching

2. **React Tests** (`test/react/`)
   - `useSurmiser.test.tsx` - Hook functionality

3. **Accessibility Tests** (`test/accessibility/`)
   - ARIA attributes, screen reader support

4. **Edge Cases** (`test/edge-cases/`)
   - Special characters, emojis, paste, autofill
   - Multiple inputs, transforms, scroll

5. **Stress Tests** (`test/stress/`)
   - High-throughput typing (150+ WPM)
   - Large corpora (10k+ items)
   - Memory leaks
   - Concurrent instances

6. **E2E Tests** (`e2e/`)
   - Real browser testing across Chromium, Firefox, WebKit
   - Mobile gestures and IME composition

### Running Specific Tests

```bash
# Run specific test file
pnpm test engine.test.ts

# Run tests matching pattern
pnpm test --grep "suggestion"

# Run with coverage
pnpm test --coverage

# Run E2E tests for specific browser
npx playwright test --project=chromium
```

---

## Code Style

### TypeScript

- **Strict mode enabled** - No `any` types in production code
- **Explicit return types** for public APIs
- **JSDoc comments** for exported functions and types
- **Meaningful variable names** - prefer clarity over brevity

**Example:**

```typescript
/**
 * Attaches Surmiser autocomplete to an input element.
 * 
 * @param element - The input element to enhance
 * @param options - Configuration options
 * @returns Function to detach and clean up
 * 
 * @example
 * ```typescript
 * const input = document.getElementById('email');
 * const detach = attachSurmiser(input, {
 *   corpus: ['hello@example.com']
 * });
 * ```
 */
export function attachSurmiser(
  element: HTMLInputElement,
  options?: AttachOptions
): DetachFunction {
  // Implementation
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `attach-surmiser.ts`)
- **Components**: `PascalCase.tsx` (e.g., `SurmiserInput.tsx`)
- **Functions**: `camelCase` (e.g., `attachSurmiser`)
- **Types/Interfaces**: `PascalCase` (e.g., `AttachOptions`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_DEBOUNCE_MS`)

### React

- **Functional components** with hooks
- **TypeScript** for all components
- **Props interface** for each component
- **Ref forwarding** where appropriate

```tsx
interface SurmiserInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  corpus?: string[];
  onAccept?: (suggestion: string) => void;
}

export const SurmiserInput = forwardRef<HTMLInputElement, SurmiserInputProps>(
  ({ corpus, onAccept, ...props }, ref) => {
    // Implementation
  }
);
```

### Comments

- Use comments to explain **why**, not **what**
- Complex algorithms should have explanatory comments
- TODO comments should include issue numbers: `// TODO(#123): Implement feature`

---

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`pnpm test:run`)
- [ ] E2E tests pass (`npx playwright test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No TypeScript errors (`pnpm exec tsc --noEmit`)
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated (for significant changes)

### PR Title

Use conventional commit format:

```
feat: add support for custom tokenizers
fix: ghost text positioning on transformed elements
docs: improve API examples for React hooks
```

### PR Description

Include:

1. **What** - What does this PR do?
2. **Why** - Why is this change needed?
3. **How** - How does it work? (for complex changes)
4. **Testing** - How was this tested?
5. **Screenshots** - For UI changes (optional)
6. **Breaking Changes** - If applicable

**Template:**

```markdown
## Description
Brief description of the change.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- Change 1
- Change 2

## Testing
How was this tested? Include test cases added.

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Breaking Changes
[Describe any breaking changes and migration path]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. **Automated Checks**: CI must pass (tests, build, type check)
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Maintainers may test manually on different platforms
4. **Merge**: Maintainer will merge using squash commit

---

## Release Process

(For maintainers)

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Steps

1. Update version in `packages/surmiser/package.json`
2. Update `CHANGELOG.md` with release notes
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push --tags`
5. Publish to npm: `pnpm publish`
6. Create GitHub release with notes

---

## Questions?

- **Bug reports**: [GitHub Issues](https://github.com/MohamedH1998/surmiser/issues)
- **Feature requests**: [GitHub Issues](https://github.com/MohamedH1998/surmiser/issues)
- **Security**: See [SECURITY.md](./SECURITY.md)
- **API questions**: See [docs/API.md](./docs/API.md)

---

## Recognition

Contributors will be:
- Listed in release notes
- Mentioned in CHANGELOG.md
- Added to contributors list (coming soon)

Thank you for contributing to Surmiser! 🎉

