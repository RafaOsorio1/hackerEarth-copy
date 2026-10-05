# Bug Fix: Single Technology Challenge Generation Fails on privateTests Array Length

- **Slug**: apps-web-src-features-assessment-components-practicesetup-tsx
- **Fixed**: 2026-10-02T15:03:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Relaxed the private test file schema requirement from `min(2)` to `min(1)` in `GeneratedChallengeSchema`, clarified prompt instructions for test generation, provided defensive JSON normalization for single-object test responses in `GeminiProvider`, and added automatic single-retry resilience in `ChallengeGeneratorService`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `packages/ai/src/types.ts` | modified | Changed `privateTests` validation constraint from `.min(2)` to `.min(1)` |
| `packages/ai/src/prompts/challengePrompt.ts` | modified | Clarified test suite instructions to allow 1-2 private test suites |
| `packages/ai/src/providers/gemini.ts` | modified | Added defensive array normalization for non-array file/test payloads |
| `apps/api/src/features/challenge/services/challenge-generator.service.ts` | modified | Added automatic single-retry on initial generation/parse errors before pre-validation |
| `packages/ai/src/index.test.ts` | modified | Added unit test asserting `GeneratedChallengeSchema` accepts single-technology challenges with 1 private test file |
| `apps/api/src/features/challenge/__tests__/challenge-generator.test.ts` | modified | Added tests for single-tech generation with 1 private test file and provider failure retry |

## Diff Highlights

```typescript
// packages/ai/src/types.ts
export const GeneratedChallengeSchema = z.object({
  ...
  publicTests: z.array(TestFileSchema).min(1),
- privateTests: z.array(TestFileSchema).min(2),
+ privateTests: z.array(TestFileSchema).min(1),
  canonicalSolution: z.array(CanonicalSolutionFileSchema).min(1),
});
```

```typescript
// apps/api/src/features/challenge/services/challenge-generator.service.ts
    try {
      let challenge: GeneratedChallenge;
      try {
        challenge = await generateSingle();
      } catch (firstErr) {
        console.warn(`[ChallengeGenerator] Initial generation failed (${firstErr instanceof Error ? firstErr.message : String(firstErr)}). Attempting single retry...`);
        challenge = await generateSingle();
      }
      ...
```

## Tests Added or Updated

- `packages/ai/src/index.test.ts::AI Multi-Model Provider Architecture > should accept challenges with a single private test file and reject empty test arrays` — Pins down that challenges with 1 private test file are valid, while empty arrays are rejected.
- `apps/api/src/features/challenge/__tests__/challenge-generator.test.ts::ChallengeGeneratorService > should successfully generate challenge for a single technology with a single private test file` — Verifies end-to-end service generation for single-topic assessments (e.g. JavaScript).
- `apps/api/src/features/challenge/__tests__/challenge-generator.test.ts::ChallengeGeneratorService > should automatically retry once if provider.generateChallenge throws initially` — Verifies automatic single retry when initial AI model invocation fails.

## Local Verification

- Commands run:
  - `pnpm test` → 10 test suites passed (40 tests passed across packages/ai and apps/api).
  - `pnpm -r exec tsc --noEmit` → 0 errors across all monorepo packages.
- Manual checks: Confirmed schema parity between `publicTests` (`min(1)`) and `privateTests` (`min(1)`) per FR-007 specifications.

## Deviations from Assessment

None. The implementation followed the proposed preferred remediation precisely.

## Follow-ups

- Run `/speckit-bug-test slug=apps-web-src-features-assessment-components-practicesetup-tsx` to verify resolution in sandbox environment.
