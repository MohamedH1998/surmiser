# Surmiser API Documentation

Complete API reference for Surmiser - the autocomplete primitive for the web.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Vanilla JavaScript API](#vanilla-javascript-api)
- [React API](#react-api)
- [Configuration Options](#configuration-options)
- [Provider System](#provider-system)
- [Events & Callbacks](#events--callbacks)
- [TypeScript Types](#typescript-types)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
npm install surmiser
# or
pnpm add surmiser
# or
yarn add surmiser
```

---

## Quick Start

### React (Recommended)

```tsx
import { SurmiserInput } from "surmiser/react";

// Standalone (no provider needed)
function App() {
  return <SurmiserInput placeholder="Type something..." />;
}

// Or with Provider for shared configuration
import { SurmiserProvider, SurmiserInput } from "surmiser/react";

function App() {
  return (
    <SurmiserProvider corpus={['shared', 'phrases']}>
      <SurmiserInput placeholder="Type something..." />
    </SurmiserProvider>
  );
}
```

### Vanilla JavaScript

```javascript
import { attachSurmiser } from "surmiser";

const input = document.getElementById("my-input");
attachSurmiser(input);
```

---

## Vanilla JavaScript API

### `attachSurmiser(element, options?)`

Attaches Surmiser autocomplete functionality to an HTML input element.

**Parameters:**

- `element: HTMLInputElement` - The input element to enhance
- `options?: AttachOptions` - Configuration options (optional)

**Returns:** `DetachFunction` - Function to clean up and remove Surmiser

**Example:**

```javascript
import { attachSurmiser } from "surmiser";

const input = document.getElementById("email-input");

const detach = attachSurmiser(input, {
  corpus: ["hello@example.com", "support@company.com"],
  debounceMs: 150,
  minConfidence: 75,
  onAccept: (suggestion) => {
    console.log("Accepted:", suggestion);
  },
});

// Later, to clean up:
detach();
```

### `localPredictive(corpus, options?)`

Creates a local predictive provider from an array of strings.

**Parameters:**

- `corpus: string[]` - Array of phrases to suggest
- `options?: ProviderOptions` - Provider configuration (optional)

**Returns:** `Provider` - A provider instance

**Example:**

```javascript
import { attachSurmiser, localPredictive } from "surmiser";

const gitCommands = ["git commit -m", "git push origin main", "git pull"];
const commonPhrases = ["thanks", "sounds good", "let me know"];

attachSurmiser(input, {
  providers: [
    localPredictive(gitCommands, { priority: 20 }),
    localPredictive(commonPhrases, { priority: 10 }),
  ],
});
```

---

## React API

### `<SurmiserProvider>`

Optional context provider that configures Surmiser for all child components.

**Note:** This provider is optional. Components like `<SurmiserInput>` and `useSurmiser()` work standalone without it. Use the provider when you want to share configuration across multiple inputs.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `corpus` | `string[]` | Default corpus | Array of phrases to suggest |
| `provider` | `Provider` | Default provider | Custom provider instance |
| `debounceMs` | `number` | `200` | Debounce delay for suggestions (ms) |
| `minConfidence` | `number` | `70` | Minimum confidence threshold (0-100) |
| `children` | `ReactNode` | - | Child components |

**Rules:**
- `corpus` and `provider` are mutually exclusive (will throw error if both specified)
- Children can add to providers with `corpus` (additive) or replace with `providers` (full override)

**Example:**

```tsx
import { SurmiserProvider } from "surmiser/react";

function App() {
  const phrases = ["feature request", "bug report", "deploy to prod"];

  return (
    <SurmiserProvider corpus={phrases} debounceMs={150}>
      <MyForm />
    </SurmiserProvider>
  );
}
```

### `<SurmiserInput>`

Drop-in input component with Surmiser functionality built-in. Works standalone or within a `<SurmiserProvider>`.

**Props:**

All standard HTML input props, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `corpus` | `string[]` | Context corpus | Additional phrases (additive) |
| `providers` | `Provider[]` | Context providers | Replace all providers |
| `debounceMs` | `number` | `200` | Override context debounce |
| `minConfidence` | `number` | `70` | Override context confidence |
| `onAccept` | `(suggestion: string) => void` | - | Callback when suggestion accepted |
| `onDismiss` | `() => void` | - | Callback when suggestion dismissed |

**Example:**

```tsx
import { SurmiserInput } from "surmiser/react";

function EmailForm() {
  const [email, setEmail] = useState("");

  return (
    // Works standalone without a Provider
    <SurmiserInput
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter email..."
      corpus={["hello@example.com", "support@company.com"]}
      onAccept={(suggestion) => console.log("Accepted:", suggestion)}
    />
  );
}

// Or use with Provider for shared configuration
import { SurmiserProvider, SurmiserInput } from "surmiser/react";

function EmailForm() {
  return (
    <SurmiserProvider corpus={["global", "phrases"]}>
      <SurmiserInput placeholder="Enter email..." />
    </SurmiserProvider>
  );
}
```

### `useSurmiser(options?)`

Hook to integrate Surmiser with custom input components (e.g., Shadcn, MUI, Chakra). Works standalone or within a `<SurmiserProvider>`.

**Parameters:**

- `options?: UseSurmiserOptions` - Configuration options (optional)

**Returns:**

```typescript
{
  attachRef: RefCallback<HTMLInputElement>;
  suggestion: string | null;
  isVisible: boolean;
}
```

**Example:**

```tsx
import { useSurmiser } from "surmiser/react";
import { Input } from "@/components/ui/input"; // Your custom component

// Standalone usage (no provider needed)
function CustomInput() {
  const { attachRef, suggestion, isVisible } = useSurmiser({
    corpus: ["git commit", "git push", "git pull"],
    onAccept: (s) => console.log("Accepted:", s),
  });

  return <Input ref={attachRef} placeholder="Type a command..." />;
}

// Or use within a Provider to inherit shared config
import { SurmiserProvider } from "surmiser/react";

function App() {
  return (
    <SurmiserProvider corpus={["shared", "phrases"]}>
      <CustomInput />
    </SurmiserProvider>
  );
}
```

**Additive vs Replacement Behavior:**

```tsx
<SurmiserProvider corpus={commonPhrases}>
  {/* Uses: commonPhrases from context */}
  <Input1 />

  {/* Uses: commonPhrases + gitCommands (ADDITIVE) */}
  <Input2 corpus={gitCommands} />

  {/* Uses: ONLY customProvider (REPLACEMENT) */}
  <Input3 providers={[customProvider]} />
</SurmiserProvider>
```

---

## Configuration Options

### `AttachOptions`

Options for `attachSurmiser` and React hooks.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `corpus` | `string[]` | `undefined` | Simple array of phrases to suggest |
| `providers` | `Provider[]` | `undefined` | Advanced: multiple providers with priority |
| `debounceMs` | `number` | `200` | Delay before showing suggestions (ms) |
| `minConfidence` | `number` | `70` | Minimum confidence score (0-100) to show suggestion |
| `onAccept` | `(suggestion: string) => void` | `undefined` | Callback when user accepts suggestion |
| `onDismiss` | `() => void` | `undefined` | Callback when user dismisses suggestion |

**Important:** `corpus` and `providers` are mutually exclusive.

```javascript
// ✅ Simple - use corpus
attachSurmiser(input, { corpus: ["hello", "world"] });

// ✅ Advanced - use providers
attachSurmiser(input, { providers: [provider1, provider2] });

// ❌ Error - cannot use both
attachSurmiser(input, { corpus: [...], providers: [...] });
```

---

## Provider System

Providers generate suggestions. Surmiser includes a default local provider, but you can create custom providers (e.g., API-based).

### Provider Interface

```typescript
interface Provider {
  priority: number; // Higher = checked first (default: 10)
  suggest: (
    input: string,
    signal: AbortSignal
  ) => Promise<Suggestion | null>;
}

interface Suggestion {
  text: string; // Full suggestion text
  confidence: number; // 0-100 score
}
```

### Creating a Custom Provider

```typescript
import type { Provider, Suggestion } from "surmiser";

const apiProvider: Provider = {
  priority: 15, // Higher priority than default (10)
  
  async suggest(input: string, signal: AbortSignal): Promise<Suggestion | null> {
    try {
      const response = await fetch(`/api/suggest?q=${encodeURIComponent(input)}`, {
        signal, // Respect cancellation
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        text: data.suggestion,
        confidence: data.confidence,
      };
    } catch (error) {
      if (error.name === 'AbortError') return null; // Cancelled
      console.error('Suggestion API error:', error);
      return null;
    }
  },
};

// Use it
attachSurmiser(input, {
  providers: [apiProvider, localPredictive(fallbackPhrases)],
});
```

### Multiple Corpora with Different Priorities

```typescript
import { attachSurmiser, localPredictive } from "surmiser";

const highPriorityPhrases = ["urgent", "critical", "immediate"];
const normalPhrases = ["hello", "thanks", "please"];

attachSurmiser(input, {
  providers: [
    { ...localPredictive(highPriorityPhrases), priority: 20 },
    { ...localPredictive(normalPhrases), priority: 10 },
  ],
});
```

---

## Events & Callbacks

### `onAccept(suggestion: string)`

Called when the user accepts a suggestion via Tab, Arrow Right, or swipe gesture.

```typescript
attachSurmiser(input, {
  onAccept: (suggestion) => {
    console.log("User accepted:", suggestion);
    // Analytics tracking, logging, etc.
  },
});
```

### `onDismiss()`

Called when the user explicitly dismisses a suggestion via Escape or double-space.

```typescript
attachSurmiser(input, {
  onDismiss: () => {
    console.log("User dismissed suggestion");
    // Track dismissal rate, adjust confidence threshold, etc.
  },
});
```

---

## TypeScript Types

All types are exported from the main package:

```typescript
import type {
  Provider,
  Suggestion,
  AttachOptions,
  DetachFunction,
  UseSurmiserOptions,
} from "surmiser";
```

### Core Types

```typescript
// Provider creates suggestions
interface Provider {
  priority: number;
  suggest: (input: string, signal: AbortSignal) => Promise<Suggestion | null>;
}

// Suggestion from a provider
interface Suggestion {
  text: string;
  confidence: number; // 0-100
}

// Options for attachSurmiser
interface AttachOptions {
  corpus?: string[];
  providers?: Provider[];
  debounceMs?: number;
  minConfidence?: number;
  onAccept?: (suggestion: string) => void;
  onDismiss?: () => void;
}

// Function returned by attachSurmiser
type DetachFunction = () => void;

// Options for useSurmiser hook
interface UseSurmiserOptions extends AttachOptions {
  // Same as AttachOptions
}
```

---

## Keyboard & Gesture Controls

### Desktop

| Key | Action |
|-----|--------|
| **Tab** | Accept suggestion |
| **Arrow Right** | Accept suggestion (at end of input) |
| **Escape** | Dismiss suggestion |
| **Double Space** | Dismiss suggestion |

### Mobile

| Gesture | Action |
|---------|--------|
| **Swipe Right** | Accept suggestion |
| **Tap Ghost Text** | Accept suggestion |
| **Double Space** | Dismiss suggestion |

All interactions are accessible and WCAG 2.1 AA compliant.

---

## Troubleshooting

### Ghost text not appearing

**Check:**
1. Is the input element an `<input type="text">` or `<textarea>`?
2. Is the input focused and does it have text?
3. Are suggestions being generated? Check `onAccept` callback.
4. Is confidence threshold too high? Try lowering `minConfidence`.

```typescript
// Debug mode
attachSurmiser(input, {
  minConfidence: 0, // Show all suggestions
  onAccept: (s) => console.log("Accepted:", s),
});
```

### Suggestions not relevant

**Solutions:**
1. Use a custom corpus matching your use case
2. Adjust confidence threshold
3. Implement a custom provider with better matching logic

```typescript
const domainSpecific = [
  "Your domain-specific phrases here",
  "More relevant suggestions",
];

attachSurmiser(input, { corpus: domainSpecific });
```

### Performance issues with large corpus

**Solutions:**
1. Reduce corpus size (< 10,000 items recommended)
2. Increase debounce delay
3. Split into multiple providers by priority

```typescript
attachSurmiser(input, {
  debounceMs: 300, // Longer delay = less frequent processing
  providers: [
    localPredictive(commonPhrases), // Small, frequently matched
    localPredictive(rarePhrases), // Large, rarely matched
  ],
});
```

### TypeScript errors with refs

```tsx
// ✅ Correct
const { attachRef } = useSurmiser();
<Input ref={attachRef} />

// ❌ Incorrect
const inputRef = useRef<HTMLInputElement>(null);
const { attachRef } = useSurmiser();
<Input ref={inputRef} /> // Won't work - attachRef must be used directly
```

### React StrictMode double-mounting

Surmiser is compatible with React StrictMode. Cleanup is handled automatically:

```tsx
// ✅ Works correctly in StrictMode
<React.StrictMode>
  <SurmiserProvider>
    <App />
  </SurmiserProvider>
</React.StrictMode>
```

### Ghost text positioning issues

If ghost text appears in wrong position:

1. **Check for CSS transforms:** Surmiser handles transforms automatically, but extreme transformations may cause issues.
2. **Check for dynamic resizing:** Ghost text re-syncs on input, but manual container resizing may require re-attaching.
3. **Check viewport:** On mobile, virtual keyboard changes viewport. Surmiser handles this automatically.

### Content Security Policy (CSP)

Surmiser uses inline styles for ghost text positioning. If you have strict CSP:

```html
<!-- Add to CSP header or meta tag -->
<meta http-equiv="Content-Security-Policy" 
      content="style-src 'self' 'unsafe-inline';">
```

Or use nonces:

```typescript
// Surmiser doesn't currently support CSP nonces
// This is a known limitation - contributions welcome!
```

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully Supported |
| Firefox | Latest | ✅ Fully Supported |
| Safari | Latest | ✅ Fully Supported |
| Edge | Latest | ✅ Fully Supported |
| Chrome Mobile | Latest | ✅ Fully Supported |
| Safari Mobile | Latest | ✅ Fully Supported |

See [BROWSER_SUPPORT.md](../BROWSER_SUPPORT.md) for detailed compatibility information.

---

## Examples

### Email Input

```tsx
const emailPhrases = [
  "hello@example.com",
  "support@company.com",
  "info@website.com",
];

<SurmiserInput
  type="email"
  placeholder="Enter email..."
  corpus={emailPhrases}
/>;
```

### Chat/Messaging

```tsx
const chatPhrases = [
  "Thanks for the update!",
  "Sounds good to me.",
  "Let me know if you need anything.",
  "I'll take a look at this.",
];

<SurmiserProvider corpus={chatPhrases}>
  <ChatInput />
</SurmiserProvider>;
```

### Code Comments

```tsx
const codePhrases = [
  "TODO: ",
  "FIXME: ",
  "NOTE: ",
  "HACK: ",
  "// eslint-disable-next-line",
];

<SurmiserInput corpus={codePhrases} />;
```

### API-Based Suggestions

```tsx
const apiProvider: Provider = {
  priority: 15,
  async suggest(input, signal) {
    const res = await fetch(`/api/suggest?q=${input}`, { signal });
    const data = await res.json();
    return { text: data.text, confidence: data.score };
  },
};

<SurmiserProvider provider={apiProvider}>
  <Input />
</SurmiserProvider>;
```

---

## Next Steps

- [View Examples](../examples/)
- [Contributing Guide](../CONTRIBUTING.md)
- [Report Issues](https://github.com/MohamedH1998/surmiser/issues)
- [Security Policy](../SECURITY.md)

---

**Questions?** Open an issue on [GitHub](https://github.com/MohamedH1998/surmiser/issues) or check existing discussions.

