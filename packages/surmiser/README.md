# surmiser

**The autocomplete primitive for the web.**

Add "Smart Compose" style predictive text to any input in minutes. Local-first, privacy-focused, and completely UI agnostic.

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
