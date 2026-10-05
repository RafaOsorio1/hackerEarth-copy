# Bug Assessment: Challenge Generation Fails with Unexpected Non-Whitespace Character After JSON

- **Slug**: apps-web-src-features-assessment-hooks-usecreateassessment-ts
- **Created**: 2026-10-02T15:11:00Z
- **Source**: Pasted text and screenshot
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

The user submitted a screenshot and message reporting an error during challenge generation in the web application:

```text
nuevamente al generar una prueba slug="/Users/rafa/Documents/GitHub/hackerEarth-copy/apps/web/src/features/assessment/hooks/useCreateAssessment.ts"
```

The attached screenshot of the browser UI and DevTools Network tab displays:
- **Selected Tech Stack**: `HTML5` (single technology)
- **Target Seniority & Difficulty**: `Junior / Beginner`
- **AI Assessment Engine & Model**: `Gemini 3 Flash` (Active)
- **UI Error Banner**: `Challenge generation failed: Unexpected non-whitespace character after JSON at position 6229 (line 39 column 1)`
- **Network Response**: HTTP 502 Bad Gateway from `POST http://localhost:4000/api/assessments`:
  ```json
  {
    "error": "ChallengeGenerationError",
    "message": "Challenge generation failed: Unexpected non-whitespace character after JSON at position 6229 (line 39 column 1)",
    "code": "CHALLENGE_GENERATION_FAILED"
  }
  ```
- **Initiator**: `useCreateAssessment.ts:20` (`createAssessment`)

## Symptom

When a user attempts to generate a coding assessment (specifically with `HTML5` at `Junior / Beginner` difficulty using `Gemini 3 Flash`), the backend responds with HTTP 502 and the UI displays `Challenge generation failed: Unexpected non-whitespace character after JSON at position 6229 (line 39 column 1)`. The candidate cannot launch the assessment workspace.

## Reproduction

1. Navigate to the Practice Setup page at `http://localhost:3000`.
2. Select a single technology, e.g., `HTML5` (deselect all other technologies).
3. Select `Junior / Beginner` difficulty.
4. Ensure `Gemini 3 Flash` is the selected AI model.
5. Click "Launch Assessment Workspace".
6. Observe the red banner with: `Challenge generation failed: Unexpected non-whitespace character after JSON at position 6229 (line 39 column 1)`.

## Suspected Code Paths

- `packages/ai/src/providers/gemini.ts:11-28, 122, 136` — `cleanJson` uses a naive brace extraction logic: `firstBrace = cleaned.indexOf('{')` and `lastBrace = cleaned.lastIndexOf('}')`. If the Gemini model appends explanatory notes, markdown commentary, or code blocks that contain any curly brace (`{}` or `{ ... }`), `lastBrace` captures the brace from the commentary rather than the root JSON closing brace.
- `packages/ai/src/providers/claude.ts:39-50` & `packages/ai/src/providers/openai.ts:43` — Potential similar vulnerability if raw model responses include trailing commentary or multiple markdown fences.
- `packages/ai/src/prompts/challengePrompt.ts:32-55` — Prompt asks the model not to include markdown code fences, but LLMs frequently append markdown backticks or commentary following the JSON closing brace.
- `apps/web/src/features/assessment/hooks/useCreateAssessment.ts:39-55` — Consumes the backend API response and catches the 502 error to display the raw error string in the UI.

## Root Cause Hypothesis

**Confidence: High**

The root cause is in the `cleanJson` function in `packages/ai/src/providers/gemini.ts`.
`cleanJson` attempts to isolate the JSON payload by taking the substring between `cleaned.indexOf('{')` and `cleaned.lastIndexOf('}') + 1`. When the AI model produces explanatory text, markdown code blocks, or usage tips following the JSON block (e.g. `Here is an example: function test() { ... }` or `import { expect } from 'vitest'`), `cleaned.lastIndexOf('}')` matches the curly brace in the trailing text instead of the JSON root object's closing brace.

Consequently, `cleaned.substring(firstBrace, lastBrace + 1)` leaves trailing text (such as `\n```\nHere is an explanation...`) immediately after the valid JSON object closing brace `}`. When V8's `JSON.parse` finishes parsing the root JSON object at character position 6228, it encounters the non-whitespace trailing characters at position 6229 (line 39 column 1) and throws `SyntaxError: Unexpected non-whitespace character after JSON at position 6229 (line 39 column 1)`.

## Proposed Remediation

**Preferred**:
1. **Implement balanced brace parsing in `cleanJson` (`packages/ai/src/providers/gemini.ts`)**:
   - Locate the root `{`.
   - Scan characters while tracking string literals (quotes `"` and escape sequences `\"`), incrementing depth on `{` and decrementing on `}`.
   - When depth reaches 0, identify that index as the exact end of the JSON object, completely ignoring any subsequent text, markdown fences, or trailing code snippets.
   - Also support extracting the inner content if wrapped in ````json ... ```` fences prior to brace scanning.
2. **Add comprehensive unit tests in `packages/ai/src/index.test.ts`**:
   - Verify that `cleanJson` (or `GeminiProvider.generateChallenge`) cleanly parses AI responses with trailing text, trailing markdown code blocks with functions/curly braces, and trailing comments without throwing `SyntaxError`.
3. **Resilience across other providers**:
   - Verify that `claude.ts` and `openai.ts` use consistent defensive JSON extraction to prevent identical failures.

**Alternatives**:
- **JSON mode schema enforcement**: Use Gemini's structured output schema (`responseSchema`) with GoogleGenAI SDK to strictly guarantee only pure JSON is emitted by the API.
  - *Trade-off*: More restrictive schema definition across nested arrays, but balanced brace extraction is necessary regardless to defend against SDK response quirks.

**Files likely to change**:
- `packages/ai/src/providers/gemini.ts`
- `packages/ai/src/index.test.ts`

**Tests to add or update**:
- Unit test in `packages/ai/src/index.test.ts` providing raw mock strings containing valid JSON followed by markdown explanations, secondary code blocks, and trailing `{ ... }` to ensure extraction succeeds.

## Risks & Considerations

- **Brace handling in string values**: The balanced brace scanner must correctly handle curly braces inside strings (e.g., code snippets inside `starterFiles[].content` or `canonicalSolution[].content`) and escaped quotes (`\"`).
- **Performance**: Character scanning over 10KB string payloads takes sub-millisecond time in V8 and introduces negligible overhead.

## Open Questions

None. The exact stack trace, error position, and root cause in `cleanJson` are fully confirmed by reproduction and codebase analysis.
