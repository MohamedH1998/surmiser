# surmiser

The autocomplete primitive for the web

## install

```bash
npm i surmiser
```

## usage

### basic

```tsx
import { SurmiserProvider, SurmiserInput } from "surmiser/react";

function App() {
  const [text, setText] = useState("");

  return (
    <SurmiserProvider>
      <SurmiserInput value={text} onChange={(e) => setText(e.target.value)} />
    </SurmiserProvider>
  );
}
```
