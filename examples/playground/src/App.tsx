import { useState, useEffect, useRef, useMemo } from 'react';
import { SurmiserProvider, SurmiserInput, useSurmiser } from 'surmiser/react';
import {
  attachSurmiser,
  localPredictive,
  type SuggestionContext,
} from 'surmiser';
import { Input } from './components/ui/input';

// @CHECK: When custom corpus at the input, should it be additive or replacement? Maybe if using a provider it should be additive, otherwise it should be replacement.

// @TODO: Make sure tests cover these examples

// ORDER (example progression)
// 1. Vanilla JS attach() - default corpus
// 2. Vanilla JS attach() - custom corpus
// 3. Standalone hook - default corpus
// 4. Standalone hook - custom corpus
// 5. SurmiserInput - default corpus
// 6. SurmiserInput - custom corpus
// 7. With Provider - inherited corpus
// 8. With Provider - additive corpus
// 9. Advanced patterns (re-renders, dynamic corpus)

// Corpus examples
const SPORTS = [
  'arsenal are winning the premier league this year',
  'what do we think of tottenham?',
];

const DEV_TERMS = [
  'feature request submitted',
  'bug report filed',
  'deploy to production',
  'rollback changes',
];

const GREETINGS = [
  'custom greetings!',
  'custom greetings 2',
  'custom greetings 3',
  "hi! i think you're great?",
  "no way!!! seriously?? that's wild...",
  'hello zzz',
  'helly what the helly',
  'ok... fine! but why??',
  'he said (quietly) wow!',
  'amazing! right?',
  'state-of-the-art, obviously.',
  'final score was 3-1! they played well.',
  'lol?? no way bro...',
  "he literally said 'go now!' and left.",
];

const customProvider = {
  id: 'custom',
  priority: 100,
  suggest: async (ctx: SuggestionContext) => {
    console.log('🔴 - custom provider suggest', ctx);
    return null;
  },
};

const customProviderProps = {
  provider: customProvider,
  debounceMs: 100,
  minConfidence: 70,
};

/* 1. Vanilla JS attach() - default corpus */
const VanillaDefaultExample = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const detach = attachSurmiser(inputRef.current);

    return () => detach();
  }, []);

  return (
    <input
      ref={inputRef}
      placeholder="Type 'thanks', 'let me', 'sounds'..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 2. Vanilla JS attach() - custom corpus */
const VanillaCustomExample = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const detach = attachSurmiser(inputRef.current, {
      corpus: GREETINGS,
    });

    return () => detach();
  }, []);

  return (
    <input
      ref={inputRef}
      placeholder="Type 'custom', 'lol', 'hi'..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 3. Standalone hook - default corpus */
const StandaloneDefault = () => {
  const { attachRef } = useSurmiser();

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'thanks', 'let me', 'sounds'..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 4. Standalone hook - custom corpus */
const StandaloneCustomCorpus = () => {
  const { attachRef } = useSurmiser({
    corpus: SPORTS,
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'arsenal', 'what'..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 5. SurmiserInput - default corpus */
const SurmiserInputDefault = () => {
  const [value, setValue] = useState('');

  return (
    <SurmiserInput
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder="Type 'thanks', 'let me', 'sounds'..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 6. SurmiserInput - custom corpus */
const SurmiserInputWithCorpus = () => {
  const [value, setValue] = useState('');

  return (
    <SurmiserInput
      value={value}
      onChange={e => setValue(e.target.value)}
      corpus={SPORTS}
      placeholder="Type arsenal/what phrases..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 7. With Provider - inherited corpus */
const WithProviderInherit = () => {
  const { attachRef } = useSurmiser();

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'feature', 'bug', 'deploy'..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 8. With Provider - additive corpus */
const WithProviderAdditive = () => {
  const { attachRef } = useSurmiser({
    corpus: ['custom additive phrase', 'another custom phrase'],
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'custom' or provider terms..."
      className="w-full p-3 border rounded"
    />
  );
};

//  8. With  Custom Provider Logic
const WithCustomProvider = () => {
  const { attachRef } = useSurmiser();

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'custom' or provider terms..."
      className="w-full p-3 border rounded"
    />
  );
};

const RemoteEndpointCustomInput = () => {
  const { attachRef } = useSurmiser({
    providers: [
      {
        id: 'ai',
        endpoint: '/api/surmiser-suggest',
      },
      localPredictive(GREETINGS),
    ],
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'custom' or provider terms..."
      className="w-full p-3 border rounded"
    />
  );
};

/* 9a. Advanced: multiple re-renders (now actually memoized) */
const RerenderStressTest = () => {
  const [count, setCount] = useState(0);

  const corpus = useMemo(
    () => ['stress test phrase one', 'stress test phrase two'],
    []
  );

  const { attachRef } = useSurmiser({ corpus });

  return (
    <div className="space-y-2">
      <Input
        ref={attachRef}
        placeholder={`Type 'stress'... (re-renders: ${count})`}
        className="w-full p-3 border rounded"
      />
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Force re-render ({count})
      </button>
    </div>
  );
};

/* 9b. Advanced: dynamic corpus */
const DynamicCorpus = () => {
  const [mode, setMode] = useState<'sports' | 'dev'>('sports');

  const corpus = useMemo(
    () => (mode === 'sports' ? SPORTS : DEV_TERMS),
    [mode]
  );

  const { attachRef } = useSurmiser({ corpus });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('sports')}
          className={`px-3 py-1 rounded text-sm ${
            mode === 'sports' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Sports
        </button>
        <button
          onClick={() => setMode('dev')}
          className={`px-3 py-1 rounded text-sm ${
            mode === 'dev' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Dev
        </button>
      </div>
      <Input
        ref={attachRef}
        placeholder={
          mode === 'sports'
            ? 'Type arsenal/what...'
            : 'Type feature/bug/deploy...'
        }
        className="w-full p-3 border rounded"
      />
    </div>
  );
};

function App() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Surmiser Playground</h1>
        <p className="text-gray-600">All variations & permutations</p>
      </div>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Vanilla JS</h2>
          <p className="text-sm text-gray-600 mb-4">
            Direct DOM attachment without React
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">1. Default corpus</h3>
            <p className="text-sm text-gray-500 mb-2">
              Uses Surmiser&apos;s built-in corpus
            </p>
            <VanillaDefaultExample />
          </div>

          <div>
            <h3 className="font-medium mb-1">2. Custom corpus</h3>
            <p className="text-sm text-gray-500 mb-2">
              Replaces default with GREETINGS corpus
            </p>
            <VanillaCustomExample />
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">React (No Provider)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Direct usage without SurmiserProvider
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">3. Standalone hook (default)</h3>
            <p className="text-sm text-gray-500 mb-2">
              useSurmiser() with built-in corpus
            </p>
            <StandaloneDefault />
          </div>

          <div>
            <h3 className="font-medium mb-1">4. Standalone hook (custom)</h3>
            <p className="text-sm text-gray-500 mb-2">
              useSurmiser() with SPORTS corpus
            </p>
            <StandaloneCustomCorpus />
          </div>

          <div>
            <h3 className="font-medium mb-1">5. SurmiserInput (default)</h3>
            <p className="text-sm text-gray-500 mb-2">
              Convenience component using default corpus
            </p>
            <SurmiserInputDefault />
          </div>

          <div>
            <h3 className="font-medium mb-1">6. SurmiserInput (custom)</h3>
            <p className="text-sm text-gray-500 mb-2">
              Convenience component with SPORTS corpus
            </p>
            <SurmiserInputWithCorpus />
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">React With Provider</h2>
          <p className="text-sm text-gray-600 mb-4">
            Shared configuration across multiple inputs
          </p>
        </div>

        <SurmiserProvider corpus={DEV_TERMS}>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">7. Inherits provider corpus</h3>
              <p className="text-sm text-gray-500 mb-2">
                Uses DEV_TERMS from SurmiserProvider
              </p>
              <WithProviderInherit />
            </div>

            <div>
              <h3 className="font-medium mb-1">8. Additive corpus</h3>
              <p className="text-sm text-gray-500 mb-2">
                Provider corpus + local corpus combined
              </p>
              <WithProviderAdditive />
            </div>

            <div>
              <h3 className="font-medium mb-1">
                9. Another input (shared config)
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                All inputs share the same provider config
              </p>
              <WithProviderInherit />
            </div>
          </div>
        </SurmiserProvider>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            React With Custom Provider
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Shared configuration across multiple inputs
          </p>
        </div>

        <SurmiserProvider {...customProviderProps}>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">10. Custom provider</h3>
              <p className="text-sm text-gray-500 mb-2">
                Uses custom provider logic
              </p>

              <WithCustomProvider />
            </div>
          </div>
        </SurmiserProvider>
      </section>
      <section className="space-y-4">
        <div>
          <div>
            <h2 className="text-2xl font-semibold mb-1">Remote AI Provider</h2>
            <p className="text-sm text-gray-600 mb-4">
              LLM-powered suggestions via remote endpoint
            </p>
          </div>

          <SurmiserProvider
            providers={{
              id: 'ai',
              endpoint: '/api/surmiser-suggest',
            }}
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">11. Remote endpoint</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Type &quot;hello&quot; to see AI suggestion &quot; world&quot;
                  (mock endpoint)
                </p>
                <SurmiserInput
                  placeholder="Try typing 'hello'..."
                  className="w-full p-3 border rounded"
                />
              </div>
            </div>
          </SurmiserProvider>
          <SurmiserProvider
            providers={[
              {
                id: 'ai',
                endpoint: '/api/surmiser-suggest',
              },
              localPredictive(GREETINGS),
            ]}
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-1">
                  12. Remote endpoint w/local predictive
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Type &quot;hello&quot; to see AI suggestion &quot; world&quot;
                  (mock endpoint)
                </p>
                <SurmiserInput
                  placeholder="Try typing 'hello'..."
                  className="w-full p-3 border rounded"
                />
              </div>
            </div>
          </SurmiserProvider>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">
                13. Remote endpoint w/o provider
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Type &quot;hello&quot; to see AI suggestion &quot; world&quot;
                (mock endpoint)
              </p>
              <SurmiserInput
                providers={{
                  id: 'ai',
                  endpoint: '/api/surmiser-suggest',
                }}
                placeholder="Try typing 'hello'..."
                className="w-full p-3 border rounded"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">
                13. Remote endpoint w/o provider
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Type &quot;hello&quot; to see AI suggestion &quot; world&quot;
                (mock endpoint)
              </p>
              <RemoteEndpointCustomInput />
            </div>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Advanced Patterns</h2>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">10. Multiple re-renders</h3>
            <p className="text-sm text-gray-500 mb-2">
              Inline corpus stabilized via useMemo
            </p>
            <RerenderStressTest />
          </div>

          <div>
            <h3 className="font-medium mb-1">11. Dynamic corpus</h3>
            <p className="text-sm text-gray-500 mb-2">
              Corpus changes based on selected mode
            </p>
            <DynamicCorpus />
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
