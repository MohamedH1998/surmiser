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


### 4. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

---

## Pull Request Process

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