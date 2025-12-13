import { useState, useEffect, useRef, useMemo } from 'react';
import { SurmiserProvider, SurmiserInput, useSurmiser } from 'surmiser/react';
import {
  attachSurmiser,
  localPredictive,
  type SuggestionContext,
  type Suggestion,
} from 'surmiser';
import { Input } from './components/ui/input';

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
  suggest: async () => {
    return {
      completion: 'custom provider suggestion',
      confidence: 1,
      providerId: 'custom',
    };
  },
};

const customProviderProps = {
  providers: customProvider,
  debounceMs: 100,
  minConfidence: 0.7,
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

/* 2b. Vanilla JS with all options */
const VanillaWithOptions = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [log, setLog] = useState<string>('');

  useEffect(() => {
    if (!inputRef.current) return;

    const detach = attachSurmiser(inputRef.current, {
      corpus: SPORTS,
      debounceMs: 100,
      minConfidence: 0.7,
      onSuggestion: s => {
        setLog(s ? `Suggestion: "${s.completion}"` : 'Cleared');
      },
      onAccept: s => {
        setLog(`Accepted: "${s.completion}"`);
      },
    });

    return () => detach();
  }, []);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        placeholder="Type 'arsenal'..."
        className="w-full p-3 border rounded"
      />
      {log && <div className="text-xs text-gray-600">{log}</div>}
    </div>
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

/* Config Overrides: debounceMs at provider level */
const ConfigDebounceProvider = () => {
  const { attachRef } = useSurmiser();

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'feature'... (500ms debounce)"
      className="w-full p-3 border rounded"
    />
  );
};

/* Config Overrides: debounceMs at hook level */
const ConfigDebounceHook = () => {
  const { attachRef } = useSurmiser({
    corpus: SPORTS,
    debounceMs: 50,
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'arsenal'... (50ms debounce)"
      className="w-full p-3 border rounded"
    />
  );
};

/* Config Overrides: minConfidence */
const ConfigMinConfidence = () => {
  const { attachRef } = useSurmiser({
    corpus: GREETINGS,
    minConfidence: 0.5,
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'hello'... (0.9 min confidence)"
      className="w-full p-3 border rounded"
    />
  );
};

/* Multiple providers with priority */
const highPriorityProvider = {
  id: 'high-priority',
  priority: 100,
  suggest: async (ctx: SuggestionContext) => {
    if (ctx.inputValue.startsWith('urgent')) {
      return {
        completion: ' - handled by high priority provider!',
        confidence: 0.95,
        providerId: 'high-priority',
      };
    }
    return null;
  },
};

const lowPriorityProvider = {
  id: 'low-priority',
  priority: 10,
  suggest: async (ctx: SuggestionContext) => {
    if (ctx.inputValue.startsWith('urgent')) {
      return {
        completion: ' - handled by low priority (will be ignored)',
        confidence: 0.9,
        providerId: 'low-priority',
      };
    }
    return null;
  },
};

const MultipleProvidersWithPriority = () => {
  const { attachRef } = useSurmiser({
    providers: [lowPriorityProvider, highPriorityProvider],
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'urgent'... (high priority wins)"
      className="w-full p-3 border rounded"
    />
  );
};

/* Callbacks: onSuggestion */
const WithOnSuggestion = () => {
  const [log, setLog] = useState<string[]>([]);

  const { attachRef } = useSurmiser({
    corpus: SPORTS,
    onSuggestion: (s: Suggestion | null) => {
      setLog(prev => [
        ...prev.slice(-4),
        s
          ? `Suggestion: "${s.completion}" (${s.confidence})`
          : 'Suggestion cleared',
      ]);
    },
  });

  return (
    <div className="space-y-2">
      <Input
        ref={attachRef}
        placeholder="Type 'arsenal'..."
        className="w-full p-3 border rounded"
      />
      <div className="text-xs text-gray-600 space-y-1">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

/* Callbacks: onAccept */
const WithOnAccept = () => {
  const [accepted, setAccepted] = useState<string[]>([]);

  const { attachRef } = useSurmiser({
    corpus: DEV_TERMS,
    onAccept: (s: Suggestion) => {
      setAccepted(prev => [...prev, s.completion]);
    },
  });

  return (
    <div className="space-y-2">
      <Input
        ref={attachRef}
        placeholder="Type 'feature'... (Tab to accept)"
        className="w-full p-3 border rounded"
      />
      {accepted.length > 0 && (
        <div className="text-xs text-gray-600">
          Accepted: {accepted.join(', ')}
        </div>
      )}
    </div>
  );
};

/* Uncontrolled input */
const UncontrolledInput = () => {
  return (
    <SurmiserInput
      defaultValue=""
      corpus={SPORTS}
      placeholder="Type 'arsenal'... (uncontrolled)"
      className="w-full p-3 border rounded"
    />
  );
};

/* Provider with only config (no corpus) */
const ProviderConfigOnly = () => {
  const { attachRef } = useSurmiser({
    corpus: GREETINGS,
  });

  return (
    <Input
      ref={attachRef}
      placeholder="Type 'hello'... (inherits debounce/minConf)"
      className="w-full p-3 border rounded"
    />
  );
};

/* SurmiserInput with config overrides */
const SurmiserInputConfigOverride = () => {
  const [value, setValue] = useState('');

  return (
    <SurmiserInput
      value={value}
      onChange={e => setValue(e.target.value)}
      debounceMs={100}
      minConfidence={0.8}
      placeholder="Type 'feature'... (overrides provider config)"
      className="w-full p-3 border rounded"
    />
  );
};

/* SurmiserInput with multiple providers */
const SurmiserInputMultipleProviders = () => {
  const [value, setValue] = useState('');

  return (
    <SurmiserInput
      value={value}
      onChange={e => setValue(e.target.value)}
      providers={[
        localPredictive(GREETINGS),
        {
          id: 'custom-inline',
          priority: 50,
          suggest: async (ctx: SuggestionContext) => {
            if (ctx.inputValue.startsWith('inline')) {
              return {
                completion: ' provider suggestion!',
                confidence: 0.85,
                providerId: 'custom-inline',
              };
            }
            return null;
          },
        },
      ]}
      placeholder="Type 'hello' or 'inline'..."
      className="w-full p-3 border rounded"
    />
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

          <div>
            <h3 className="font-medium mb-1">2b. All options</h3>
            <p className="text-sm text-gray-500 mb-2">
              Custom corpus + debounce + minConfidence + callbacks
            </p>
            <VanillaWithOptions />
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

          <div>
            <h3 className="font-medium mb-1">
              6b. SurmiserInput (multiple providers)
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Mix local predictive + custom provider
            </p>
            <SurmiserInputMultipleProviders />
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
          <h2 className="text-2xl font-semibold mb-1">Config Overrides</h2>
          <p className="text-sm text-gray-600 mb-4">
            debounceMs and minConfidence at different levels
          </p>
        </div>

        <SurmiserProvider
          corpus={DEV_TERMS}
          debounceMs={500}
          minConfidence={75}
        >
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">Provider-level debounce</h3>
              <p className="text-sm text-gray-500 mb-2">
                500ms debounce from provider
              </p>
              <ConfigDebounceProvider />
            </div>

            <div>
              <h3 className="font-medium mb-1">Hook-level debounce override</h3>
              <p className="text-sm text-gray-500 mb-2">
                50ms debounce at hook level (overrides provider)
              </p>
              <ConfigDebounceHook />
            </div>

            <div>
              <h3 className="font-medium mb-1">Hook-level minConfidence</h3>
              <p className="text-sm text-gray-500 mb-2">
                0.9 min confidence (vs 0.75 provider default)
              </p>
              <ConfigMinConfidence />
            </div>

            <div>
              <h3 className="font-medium mb-1">
                SurmiserInput config override
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Overrides provider debounce and minConfidence
              </p>
              <SurmiserInputConfigOverride />
            </div>
          </div>
        </SurmiserProvider>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            Provider Config Only (No Corpus)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Share debounce/minConfidence without corpus
          </p>
        </div>

        <SurmiserProvider debounceMs={300} minConfidence={80}>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">Config-only provider</h3>
              <p className="text-sm text-gray-500 mb-2">
                Hook provides corpus, provider provides config
              </p>
              <ProviderConfigOnly />
            </div>
          </div>
        </SurmiserProvider>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            Multiple Providers with Priority
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Higher priority wins when multiple suggestions available
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">Priority ordering</h3>
            <p className="text-sm text-gray-500 mb-2">
              High priority (100) beats low priority (10)
            </p>
            <MultipleProvidersWithPriority />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Callbacks</h2>
          <p className="text-sm text-gray-600 mb-4">
            React to suggestion changes and acceptances
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">onSuggestion callback</h3>
            <p className="text-sm text-gray-500 mb-2">
              Fires on every suggestion change
            </p>
            <WithOnSuggestion />
          </div>

          <div>
            <h3 className="font-medium mb-1">onAccept callback</h3>
            <p className="text-sm text-gray-500 mb-2">
              Fires when user accepts suggestion (Tab)
            </p>
            <WithOnAccept />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            Alternative Input Types
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Works with textarea and uncontrolled inputs
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">Uncontrolled input</h3>
            <p className="text-sm text-gray-500 mb-2">
              SurmiserInput with defaultValue (no value prop)
            </p>
            <UncontrolledInput />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Advanced Patterns</h2>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-1">Multiple re-renders</h3>
            <p className="text-sm text-gray-500 mb-2">
              Inline corpus stabilized via useMemo
            </p>
            <RerenderStressTest />
          </div>

          <div>
            <h3 className="font-medium mb-1">Dynamic corpus</h3>
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
