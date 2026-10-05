# Bug Assessment: Single Technology Challenge Generation Fails with privateTests Array Length Error

- **Slug**: apps-web-src-features-assessment-components-practicesetup-tsx
- **Created**: 2026-10-02T14:56:00Z
- **Source**: Pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

The user reported the following error while reviewing the MVP when selecting a single topic to practice in the setup screen (`apps/web/src/features/assessment/components/PracticeSetup.tsx`):

```text
Revisando el mvp, al seleccionar un solo tema a practicar recibo este error "Challenge generation failed: [ { "code": "too_small", "minimum": 2, "type": "array", "inclusive": true, "exact": false, "message": "Array must contain at least 2 element(s)", "path": [ "privateTests" ] } ]" slug="apps/web/src/features/assessment/components/PracticeSetup.tsx"
```

## Symptom

When a candidate configures an assessment in the Practice Setup screen with only one technology selected (e.g., JavaScript or HTML alone) and clicks "Start Timed Assessment", the request fails with HTTP 502/400 and displays:

`Challenge generation failed: [ { "code": "too_small", "minimum": 2, "type": "array", "inclusive": true, "exact": false, "message": "Array must contain at least 2 element(s)", "path": [ "privateTests" ] } ]`

The candidate cannot start practice sessions for individual technologies.

## Reproduction

1. Open the web application at `http://localhost:3000`.
2. On the Practice Setup screen, select a single technology (e.g., click "JavaScript" and deselect all other technologies).
3. Select any difficulty level (e.g., "Intermediate").
4. Click "Start Timed Assessment".
5. Observe the error banner displaying the Zod validation failure on `privateTests`.

## Suspected Code Paths

- `packages/ai/src/types.ts:44` — `GeneratedChallengeSchema` enforces `privateTests: z.array(TestFileSchema).min(2)`. This requires the model to output at least two separate private test files.
- `packages/ai/src/prompts/challengePrompt.ts:26-27, 46-49` — The system prompt asks for "at least 2-3 hidden test suites", but for single-topic challenges, LLMs frequently bundle all private assertions into a single test file (e.g. `tests/private/edge_cases.test.js`).
- `packages/ai/src/providers/gemini.ts:109-111` — `GeminiProvider.generateChallenge` runs `GeneratedChallengeSchema.parse(normalized)` directly without normalization or tolerance for single comprehensive private test files.
- `apps/api/src/features/challenge/services/challenge-generator.service.ts:25-44` — `ChallengeGeneratorService` does not retry on initial AI generation Zod validation failures; it immediately rethrows as `ChallengeGenerationError`.
- `apps/web/src/features/assessment/components/PracticeSetup.tsx:37-45` — The UI permits selecting a single technology (`selectedTech.length === 1`), directly triggering this backend validation conflict.

## Root Cause Hypothesis

**Confidence: High**

The root cause is a strict schema constraint mismatch in `GeneratedChallengeSchema` (`packages/ai/src/types.ts`):
`privateTests: z.array(TestFileSchema).min(2)` demands that the generated challenge must have at least 2 separate test file objects in the array. However, when generating coding exercises for a single technology (such as pure JavaScript algorithms or HTML layout), the AI model naturally consolidates all private test cases into a single file (`tests/private/suite.test.js` with multiple test assertions). Because the array contains only 1 file item, Zod rejects the response with `too_small (minimum: 2, path: ['privateTests'])`.

Furthermore, `spec.md` (FR-007) requires *"a distinct private automated test suite that is strictly excluded from the user-facing workspace"*, which refers to the automated test suite as a whole (which may consist of 1 or more test files, just as `publicTests` requires `min(1)`), rather than mandating a minimum of two separate file paths.

## Proposed Remediation

**Preferred**:
1. **Relax schema constraint in `packages/ai/src/types.ts`**: Update `GeneratedChallengeSchema` so `privateTests: z.array(TestFileSchema).min(1)` matches `publicTests: z.array(TestFileSchema).min(1)`. A single test file with multiple private test cases is valid, complete, and fully executed by `SandboxRunnerService`.
2. **Reinforce prompt in `packages/ai/src/prompts/challengePrompt.ts`**: Update the instructions and JSON example in `buildChallengePrompt` to emphasize generating at least 2 private test files when possible (e.g. `tests/private/edge_cases.test.js` and `tests/private/performance.test.js`), but allow 1 if comprehensive.
3. **Resilience in `GeminiProvider` / `normalizeChallenge`**: In `packages/ai/src/providers/gemini.ts`, ensure `normalizeChallenge` gracefully handles single test suites and validates cleanly.
4. **Retry on schema failure in `ChallengeGeneratorService`**: If Gemini outputs an invalid schema structure on the first attempt, automatically retry generation once before surfacing a fatal `ChallengeGenerationError`.

**Alternatives**:
- **Synthetic file splitting in `normalizeChallenge`**: Keep `min(2)` and if the LLM produces a single private test file with multiple `test()` blocks, regex-split the file into two files (`edge_1.test.js` and `edge_2.test.js`).
  - *Trade-off*: Complex, fragile, and prone to breaking imports or shared helper scopes across tests.

**Files likely to change**:
- `packages/ai/src/types.ts`
- `packages/ai/src/prompts/challengePrompt.ts`
- `packages/ai/src/providers/gemini.ts`
- `apps/api/src/features/challenge/services/challenge-generator.service.ts`
- `packages/ai/src/index.test.ts`
- `apps/api/src/features/challenge/__tests__/challenge-generator.test.ts`

**Tests to add or update**:
- Unit test in `packages/ai/src/index.test.ts` verifying that `GeneratedChallengeSchema` accepts a challenge with 1 private test file containing multiple assertions.
- Unit test in `apps/api/src/features/challenge/__tests__/challenge-generator.test.ts` simulating challenge generation for a single technology (`['JavaScript']`) with 1 private test file.

## Risks & Considerations

- **Backwards compatibility**: Existing generated challenges with 2 or more private test files remain 100% valid under `min(1)`.
- **Sandbox execution**: `SandboxRunnerService` iterates over all files in `params.testFiles` regardless of whether there is 1 or multiple files; running 1 file with multiple assertions is already fully supported and tested.
- **Pre-validation**: `PreValidationService` merges `allTestSuites = [...challenge.publicTests, ...challenge.privateTests]`, which operates identically with 1 or multiple private test files.

## Open Questions

None. The error message is definitive, directly traceable to `GeneratedChallengeSchema.privateTests.min(2)`, and confirmed by codebase inspection.
