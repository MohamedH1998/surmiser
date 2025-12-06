import { useState } from "react";
import { SurmiserProvider, SurmiserInput } from "surmiser/react";

const DEV_TERMS = [
  "feature request",
  "bug report",
  "deploy to prod",
  "rollback",
];

function App() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Surmiser Playground</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>1. Zero Config (Default)</h2>
        <p>Try typing: "thanks", "let me", "sounds"</p>
        <SurmiserProvider>
          <div>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              Zero config test - check console
            </p>
            <SurmiserInput
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="Type here..."
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.2rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
        </SurmiserProvider>
      </section>

      <section>
        <h2>2. Custom Simple Corpus</h2>
        <p>Try typing: "feature", "bug", "deploy"</p>
        <SurmiserProvider provider={DEV_TERMS}>
          <SurmiserInput
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="Type dev terms..."
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1.2rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </SurmiserProvider>
      </section>
    </div>
  );
}

export default App;
