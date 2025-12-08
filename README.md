# surmiser

**The autocomplete primitive for the web.**

Add "Smart Compose" style predictive text to any input in minutes. Local-first, privacy-focused, and completely UI agnostic.

[Surmiser Demo](http://momito.co.uk/surmiser)

## Features

- **Batteries Included**: Comes with a default corpus of common phrases.
- **UI Agnostic**: Works with raw HTML, React, Shadcn, MUI, etc.
- **Privacy First**: Local predictive engine by default. No data leaves the client.
- **Mobile Ready**: Swipe right to accept suggestions.
- **Keyboard Friendly**: Tab or Arrow Right to accept.

## Installation

```bash
npm install surmiser
```

## Quick Start

### 1. React

Surmiser provides a drop-in component and a hook for maximum flexibility.

**The Easy Way (`SurmiserInput`)**

```tsx
import { SurmiserProvider, SurmiserInput } from "surmiser/react";

function App() {
  return (
    <SurmiserProvider>
      <SurmiserInput placeholder="Type something..." />
    </SurmiserProvider>
  );
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

<SurmiserProvider provider={DEV_TERMS}>
  <SurmiserInput />
</SurmiserProvider>;
```

### Mobile Gestures

Surmiser includes mobile-friendly gestures out of the box:

- **Swipe Right**: Accept suggestion
- **Double Space**: Dismiss suggestion

## Advanced Usage

Surmiser is built on a provider architecture. You can swap the local predictive engine for:

- Remote APIs
- LLMs
- Custom logic

## Coming soon

- **Domain Specific Corpora**: Pre-built sets for specific use cases like Email, CRM, Customer Support, and Coding (e.g. `import { emailCorpus } from 'surmiser/corpora'`).
- **AI Powered Autocomplete**: Plug-and-play integrations with LLMs for smart, context-aware suggestions.

## License

MIT
