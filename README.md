# surmiser

**The autocomplete primitive for the web.**

Add "Smart Compose" style predictive text to any input in minutes. Local-first, privacy-focused, and completely UI agnostic.

[![npm version](https://img.shields.io/npm/v/surmiser.svg)](https://www.npmjs.com/package/surmiser)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/surmiser)](https://bundlephobia.com/package/surmiser)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Surmiser Demo](http://momito.co.uk/surmiser)

## Why Surmiser?

Surmiser is a minimal, composable building block that works with your existing stack.

**Key Differentiators:**

- **UI-Agnostic**: Not tied to any framework or component library
- **Privacy-First by Design**: Local-only predictions, no tracking or telemetry
- **Production-Ready**: Comprehensive test suite
- **Developer-Friendly**: TypeScript-first with full type safety
- **Lightweight**

## Features

- **Batteries Included**: Comes with a default corpus of common phrases
- **UI Agnostic**: Works with raw HTML, React, Shadcn, MUI, or any framework
- **Privacy First**: Local predictive engine by default - no data leaves the client
- **Mobile Ready**: Swipe right to accept, optimized for touch
- **Keyboard Friendly**: Tab or Arrow Right to accept
- **Accessible**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Cross-Browser**: Tested on Chrome, Firefox, Safari, Edge, and mobile browsers
- **TypeScript**: Full type definitions included


## Installation

```bash
npm install surmiser
```

## Quick Start

### 1. React

Surmiser provides a drop-in component and a hook for maximum flexibility. **No provider required** - works standalone out of the box.

**The Easy Way (`SurmiserInput`)**

```tsx
import { SurmiserInput } from "surmiser/react";

function App() {
  return <SurmiserInput placeholder="Type something..." />;
}
```

**The Custom Way (`useSurmiser`)**

Integrates with existing UI libraries like Shadcn, MUI, or Chakra.

```tsx
import { useSurmiser } from "surmiser/react";
import { Input } from "@/components/ui/input"; // Your custom component

function MyCustomInput() {
  // 1. Get the attachRef
  const { attachRef } = useSurmiser();

  // 2. Attach it to your input
  return <Input ref={attachRef} />;
}
```

**Optional: Use Provider for Shared Configuration**

Want to share settings across multiple inputs? Use the optional `<SurmiserProvider>`:

```tsx
import { SurmiserProvider, SurmiserInput } from "surmiser/react";

function App() {
  return (
    <SurmiserProvider corpus={["shared", "phrases"]}>
      <SurmiserInput placeholder="Input 1..." />
      <SurmiserInput placeholder="Input 2..." />
    </SurmiserProvider>
  );
}
```

### 2. Vanilla JS

Works with any standard HTML input element.

```js
import { attachSurmiser } from "surmiser";

const input = document.getElementById("my-input");
attachSurmiser(input);
```

## Customization

### Custom Corpus

Want to suggest developer terms, medical jargon, or customer support phrases? Just pass an array of strings.

```tsx
const DEV_TERMS = [
  "git push origin main",
  "docker-compose up -d",
  "npm run build",
  "console.log",
];

// Standalone usage
<SurmiserInput corpus={DEV_TERMS} />

// Or with Provider (shared across multiple inputs)
<SurmiserProvider corpus={DEV_TERMS}>
  <SurmiserInput />
  <SurmiserInput />
</SurmiserProvider>;
```

## Advanced Usage

### Provider Architecture

Surmiser is built on a provider architecture. Swap the local predictive engine for custom logic:

```tsx
import type { Provider } from "surmiser";

const apiProvider: Provider = {
  priority: 15,
  async suggest(input, signal) {
    const res = await fetch(`/api/suggest?q=${input}`, { signal });
    const data = await res.json();
    return { text: data.text, confidence: data.score };
  },
};

<SurmiserProvider provider={apiProvider}>
  <App />
</SurmiserProvider>;
```

Use cases:

- **Remote APIs**: Call your backend for personalized suggestions
- **Custom Logic**: Domain-specific matching algorithms
- **Hybrid**: Combine multiple providers with priorities

## Documentation

- **[API Reference](./docs/API.md)** - Complete API documentation
- **[Contributing](./CONTRIBUTING.md)** - Development guide

## Troubleshooting

### Ghost text not appearing?

1. Check that input is focused and has text
2. Verify corpus has matching phrases
3. Try lowering `minConfidence` to 0 for debugging

```tsx
<SurmiserInput minConfidence={0} onAccept={(s) => console.log(s)} />
```

## Browser Support

| Browser       | Version | Status             |
| ------------- | ------- | ------------------ |
| Chrome        | Latest  | ✅ Fully Supported |
| Firefox       | Latest  | ✅ Fully Supported |
| Safari        | Latest  | ✅ Fully Supported |
| Edge          | Latest  | ✅ Fully Supported |
| Chrome Mobile | Latest  | ✅ Fully Supported |
| Safari Mobile | Latest  | ✅ Fully Supported |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup
- Testing guidelines
- Pull request process
- Code style guide

## License

MIT © [Mohamed Hassan](https://github.com/MohamedH1998)

---

**Questions?** [Open an issue](https://github.com/MohamedH1998/surmiser/issues) or check the [API docs](./docs/API.md).
