# Bug Fix: Challenge Generation Fails on Trailing Non-Whitespace Characters After JSON

- **Slug**: apps-web-src-features-assessment-hooks-usecreateassessment-ts
- **Fixed**: 2026-10-02T15:16:30Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Upgraded the JSON extraction logic in `packages/ai/src/providers/gemini.ts` from naive `lastIndexOf('}')` slicing to a balanced-brace parser that scans string literals, escape sequences, and object nesting depth. Trailing commentary, markdown notes, and extraneous code blocks containing curly braces are cleanly ignored, resolving `Unexpected non-whitespace character after JSON`. Also integrated this robust extractor into `ClaudeProvider` and `OpenAiProvider`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `packages/ai/src/providers/gemini.ts` | modified | Replaced naive brace slicing with balanced brace parsing in `cleanJson` and exported it |
| `packages/ai/src/providers/claude.ts` | modified | Used `cleanJson` to safely extract JSON before parsing |
| `packages/ai/src/providers/openai.ts` | modified | Used `cleanJson` to sanitize model content before parsing |
| `packages/ai/src/index.test.ts` | modified | Added 5 unit tests for `cleanJson` covering markdown wrappers, trailing commentary with braces, and escaped quotes |

## Diff Highlights

```typescript
// packages/ai/src/providers/gemini.ts
export function cleanJson(raw: string): string {
  let cleaned = raw.trim();

  // If wrapped in a markdown code block (```json ... ``` or ``` ... ```), extract its contents
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const textToScan = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1] : cleaned;

  const firstBrace = textToScan.indexOf('{');
  if (firstBrace === -1) return textToScan.trim();

  let depth = 0;
  let inString = false;
  let escape = false;
  let endBrace = -1;

  for (let i = firstBrace; i < textToScan.length; i++) {
    const char = textToScan[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }

    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) { endBrace = i; break; }
      }
    }
  }

  if (endBrace !== -1) {
    return textToScan.substring(firstBrace, endBrace + 1).trim();
  }
  ...
}
```

## Tests Added or Updated

- `packages/ai/src/index.test.ts::cleanJson robust JSON extractor > should parse clean raw JSON objects without modification`
- `packages/ai/src/index.test.ts::cleanJson robust JSON extractor > should extract JSON wrapped in markdown code blocks`
- `packages/ai/src/index.test.ts::cleanJson robust JSON extractor > should safely discard trailing markdown commentary containing functions and braces` — Pins down that functions/objects in trailing text do not break parsing.
- `packages/ai/src/index.test.ts::cleanJson robust JSON extractor > should correctly handle braces and escaped quotes inside JSON string fields` — Pins down nested strings with quotes and braces.
- `packages/ai/src/index.test.ts::cleanJson robust JSON extractor > should handle text before and after JSON object`

## Local Verification

- Commands run:
  - `pnpm test` → 10 test files passed (45 tests passed across monorepo).
  - `pnpm -r exec tsc --noEmit` → 0 errors across all monorepo workspaces.
- Manual checks: Verified that inputs containing markdown blocks and trailing explanatory text with `{ ... }` parse without `SyntaxError: Unexpected non-whitespace character after JSON`.

## Deviations from Assessment

None. Applied across Gemini, Claude, and OpenAI providers as planned.

## Follow-ups

- Run `/speckit-bug-test slug=apps-web-src-features-assessment-hooks-usecreateassessment-ts` to verify resolution.
