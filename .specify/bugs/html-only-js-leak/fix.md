# Bug Fix: HTML-Only Challenge Generation Leaks JavaScript into Starter Files and Flags Test Suites

- **Slug**: html-only-js-leak
- **Fixed**: 2026-10-02T15:40:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Added strict HTML/CSS-only prompt constraints and tailored starter file examples in `packages/ai` to forbid `.js` files and `<script>` tags when JavaScript is not selected. In `TechnologyLeakDetector`, differentiated candidate workspace files from automated runner test files so that Vitest DOM test suites (`tests/**/*.test.js`) are permitted while candidate scripts remain strictly forbidden.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `packages/ai/src/prompts/challengePrompt.ts` | modified | Added negative constraint forbidding `.js` files and `<script>` tags when HTML/CSS-only is selected; tailored prompt starter file example to `index.html` and `styles.css`. |
| `apps/api/src/features/challenge/services/technology-leak-detector.service.ts` | modified | Allowed automated test runner files (`tests/**`) to be JS/TS while enforcing strict rejection of JS/TS and `<script>` tags on candidate code files. |
| `apps/api/src/features/challenge/__tests__/technology-leak-detector.test.ts` | modified | Added test asserting test files are permitted while candidate script files are flagged as leaks. |
| `packages/ai/src/index.test.ts` | modified | Added test asserting HTML-only challenge prompts include negative script constraints and HTML/CSS starter file examples. |

## Diff Highlights

```typescript
// apps/api/src/features/challenge/services/technology-leak-detector.service.ts
    for (const file of files) {
      const lowerPath = file.path.toLowerCase();
      const content = file.content;
+     const isTestFile =
+       lowerPath.startsWith('tests/') ||
+       lowerPath.includes('.test.') ||
+       lowerPath.includes('.spec.');

      // 1. HTML+CSS only: Reject any script or JS/TS file in candidate implementation files
-     if (htmlCssOnly) {
+     if (htmlCssOnly && !isTestFile) {
        if (
          lowerPath.endsWith('.js') ||
...
```

```typescript
// packages/ai/src/prompts/challengePrompt.ts
+ const htmlOnlyConstraint = htmlCssOnly
+   ? `\n   - CRITICAL HTML/CSS-ONLY CONSTRAINT: JavaScript is NOT selected. Candidate implementation files (in starterFiles and canonicalSolution) MUST NOT contain any .js, .ts, .jsx, or .tsx files, and index.html MUST NOT contain any inline or external <script> tags. Starter files and canonical solutions must strictly be .html and/or .css files.`
+   : '';
```

## Tests Added or Updated

- `apps/api/src/features/challenge/__tests__/technology-leak-detector.test.ts::TechnologyLeakDetector Unit Tests (T048) > should allow automated runner test files (.test.js) in HTML-only challenges while rejecting candidate script files` — Pins down that test suites are permitted while candidate files with JavaScript are rejected.
- `packages/ai/src/index.test.ts::AI Multi-Model Provider Architecture > should enforce HTML/CSS-only constraints and tailor starter files in prompt when JS is not selected` — Pins down prompt generator output for HTML-only selections.

## Local Verification

- Commands run:
  - `pnpm test` → 10 test files passed (46 tests passed across monorepo).
  - `pnpm -r exec tsc --noEmit` → 0 errors across all monorepo workspaces.
- Manual checks: Verified that prompts dynamically swap `src/index.js` for `index.html` and `styles.css` when only HTML is selected.

## Deviations from Assessment

None. Both the prompt constraints and leak detector scoping were implemented exactly as proposed in the assessment.

## Follow-ups

- Run `/speckit-bug-test slug=html-only-js-leak` to verify resolution.
