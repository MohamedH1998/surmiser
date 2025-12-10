import { useState } from 'react';
import { SurmiserProvider, SurmiserInput, useSurmiser } from 'surmiser/react';
import { Input } from './components/ui/input';

const DEV_TERMS = [
  'feature request',
  'bug report',
  'deploy to prod',
  'rollback',
  'thanks',
  'let me know',
];

function ShadcnExample() {
  const { attachRef } = useSurmiser();
  return (
    <div className="w-full max-w-sm items-center space-x-2">
      <Input ref={attachRef} type="text" placeholder="Shadcn Input" />
    </div>
  );
}

function App() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 className="text-3xl font-bold mb-6">Surmiser Playground</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2 className="text-xl font-semibold mb-2">1. Zero Config (Default)</h2>
        <p className="mb-4">Try typing: "thanks", "let me", "sounds"</p>
        <SurmiserProvider>
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Zero config test - check console
            </p>
            <SurmiserInput
              value={text1}
              onChange={e => setText1(e.target.value)}
              placeholder="Type here..."
              className="w-full p-4 text-lg border border-gray-300 rounded"
            />
          </div>
        </SurmiserProvider>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 className="text-xl font-semibold mb-2">2. Custom Simple Corpus</h2>
        <p className="mb-4">Try typing: "feature", "bug", "deploy"</p>
        <SurmiserProvider provider={DEV_TERMS}>
          <SurmiserInput
            value={text2}
            onChange={e => setText2(e.target.value)}
            placeholder="Type dev terms..."
            className="w-full p-4 text-lg border border-gray-300 rounded"
          />
        </SurmiserProvider>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">3. Shadcn UI Input</h2>
        <p className="mb-4">Try typing: "thanks", "let me"</p>
        <SurmiserProvider>
          <ShadcnExample />
        </SurmiserProvider>
      </section>
    </div>
  );
}

export default App;
