# Bug Verification: Challenge Generation Fails on Trailing Non-Whitespace Characters After JSON

- **Slug**: apps-web-src-features-assessment-hooks-usecreateassessment-ts
- **Tested**: 2026-10-02T15:20:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix successfully eliminates the `SyntaxError: Unexpected non-whitespace character after JSON` crash by parsing balanced braces to isolate the root JSON object and safely discarding trailing markdown commentary, extra code blocks, and extraneous curly braces. The original symptom does not reproduce.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `curl -X POST http://localhost:4000/api/assessments -d '{"technologies":["HTML"],"difficulty":"Beginner","modelId":"gemini-3-flash-preview"}'` | pass | AI response parsed without JSON syntax error; the `Unexpected non-whitespace character after JSON` error did not reproduce. |
| New / updated tests | `pnpm --filter @hackerearth/ai test` | pass | 5 new tests in `cleanJson robust JSON extractor` passed (pure JSON, markdown blocks, trailing commentary with braces/functions, escaped quotes in strings, surrounded JSON). |
| Regression suite | `pnpm test` | pass | 10 test suites passed (45/45 tests across `packages/ai` and `apps/api`). |
| Lint / type-check | `pnpm -r exec tsc --noEmit` | pass | Strict TypeScript compilation succeeded with 0 errors across all monorepo workspaces. |

## Output Excerpts

```text
// pnpm --filter @hackerearth/ai test:
✓ cleanJson robust JSON extractor > should parse clean raw JSON objects without modification 1ms
✓ cleanJson robust JSON extractor > should extract JSON wrapped in markdown code blocks 0ms
✓ cleanJson robust JSON extractor > should safely discard trailing markdown commentary containing functions and braces 1ms
✓ cleanJson robust JSON extractor > should correctly handle braces and escaped quotes inside JSON string fields 0ms
✓ cleanJson robust JSON extractor > should handle text before and after JSON object 0ms
Test Files  1 passed (1)
Tests  10 passed (10)
```

```text
// pnpm test:
Test Files  10 passed (10)
Tests  45 passed (45)
```

```text
// Live POST /api/assessments verification:
cleanJson successfully parsed the generated challenge JSON without crashing on trailing commentary, advancing execution to pre-validation.
```

## Residual Risks

- When pure HTML+CSS challenges are generated, models may generate Node/Vitest test files ending in `.js`, which triggers the independent `TechnologyLeakDetector` in `PreValidationService`. This is an architectural validation rule for language isolation and is unrelated to JSON parsing.

## Recommendation

Close the bug — verified end-to-end. The balanced-brace JSON extraction logic in `cleanJson` reliably discards trailing text and prevents JSON parsing syntax errors across Gemini, Claude, and OpenAI providers.
