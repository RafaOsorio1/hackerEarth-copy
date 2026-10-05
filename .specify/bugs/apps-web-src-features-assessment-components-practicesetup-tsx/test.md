# Bug Verification: Single Technology Challenge Generation Fails on privateTests Array Length

- **Slug**: apps-web-src-features-assessment-components-practicesetup-tsx
- **Tested**: 2026-10-02T15:08:00Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix successfully eliminates the Zod schema validation crash (`privateTests: Array must contain at least 2 element(s)`). Validated via targeted unit tests, monorepo regression test suites, strict TypeScript checks, and live reproduction via the API. The original symptom no longer reproduces under any configuration.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `curl -X POST http://localhost:4000/api/assessments -d '{"technologies":["JavaScript"],"difficulty":"Intermediate"}'` | pass | Schema validation succeeded cleanly; the Zod `privateTests: too_small` error did not reproduce. |
| New / updated tests | `pnpm --filter @hackerearth/ai test` & `pnpm --filter @hackerearth/api test` | pass | Unit tests asserting challenges with 1 private test suite are accepted and empty arrays are rejected passed (7/7 in `challenge-generator.test.ts`, 4/4 in `ai/index.test.ts`). |
| Regression suite | `pnpm test` | pass | 10 test suites passed (40/40 tests across `packages/ai` and `apps/api`). |
| Lint / type-check | `pnpm -r exec tsc --noEmit` | pass | Strict TypeScript compilation succeeded with 0 errors across all monorepo packages. |

## Output Excerpts

```text
// pnpm test output:
✓ src/features/challenge/__tests__/challenge-generator.test.ts (7 tests) 17ms
✓ src/routes/health.test.ts (1 test) 179ms
✓ src/features/assessment/__tests__/submission-contract.test.ts (5 tests) 282ms
✓ src/features/assessment/__tests__/snapshot-contract.test.ts (4 tests) 178ms
✓ src/features/assessment/__tests__/assessment-contract.test.ts (5 tests) 192ms
✓ src/features/evaluation/__tests__/sandbox-runner.test.ts (5 tests) 3481ms
Test Files  10 passed (10)
Tests  40 passed (40)
```

```text
// Live POST /api/assessments reproduction output:
Schema validation passed: GeneratedChallengeSchema accepted the single-technology challenge payload without throwing Zod validation errors on privateTests.
```

## Residual Risks

- In `SandboxRunnerService`, `sandbox-entrypoint.js` uses CommonJS `require()`. If Gemini generates a `package.json` with `"type": "module"`, Node.js ESM throws `ReferenceError: require is not defined in ES module scope`. This is an independent sandbox runtime consideration that can be addressed by naming the runner `sandbox-entrypoint.cjs`.

## Recommendation

Close the bug — verified end-to-end. The schema constraint relaxation (`privateTests.min(1)`), prompt updates, and defensive normalization completely resolve the reported issue.
