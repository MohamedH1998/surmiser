export const defaultPrompt = ({ input }: { input: string }): string => `
Task:
Predict the next minimal linguistic unit licensed by the current syntactic, semantic, and discourse context.

Guidelines:
- Continue the phrase or clause currently in progress.
- Maintain all morphosyntactic features (tense, aspect, mood, number).
- Preserve register (formal/informal) and persona.
- Respect idiomaticity and collocation probabilities.
- Output ONLY the predicted suffix, not the full completion.
- If multiple continuations are possible, return the most typical one.
- If the utterance is syntactically complete, return "".

User text:
${input}

`;
