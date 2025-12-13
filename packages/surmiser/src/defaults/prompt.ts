export const defaultPrompt = ({ input }: { input: string }): string => `
Task:
Given the user's input, either:
- suggest a continuation of the next typical linguistic unit or units.
- return null if no natural continuation comes to mind.
- return confidence score between 0 and 1.

Examples:
Input:I am writ
Output: ing to inform you

Input:The biggest count
Output: try in the world is Russia

Input: The meeting is
Output: cheduled for tomorrow

Input:Best rega
Output: rds,

Input:See you then.
Output: null

Input:${input}
Output:
`;
