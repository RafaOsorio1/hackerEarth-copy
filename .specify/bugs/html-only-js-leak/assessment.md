# Bug Assessment: HTML-Only Challenge Generation Leaks JavaScript into Starter Files and Flags Test Suites

- **Slug**: html-only-js-leak
- **Created**: 2026-10-02T15:34:00Z
- **Source**: Pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

The user reported an error occurring when selecting only HTML:

```text
al seleccionar solo temas como HTML el modelo genera archivos js, lo cual no se permite por que este lenguaje no se seleccionó
```

This manifests in the backend pre-validation gate as:

```text
Challenge generation failed: Pre-validation failed after retry:
- Inline or external <script> tag found in index.html for HTML+CSS only challenge.
- JavaScript/TypeScript file script.js found in an HTML+CSS only challenge.
- JavaScript/TypeScript file tests/public/navigation.test.js found in an HTML+CSS only challenge.
- JavaScript/TypeScript file tests/private/validation.test.js found in an HTML+CSS only challenge.
```

## Symptom

When a user selects only `HTML` (or `HTML` + `CSS`) in Practice Setup without selecting `JavaScript`, challenge generation consistently fails pre-validation after retry with HTTP 502 (`ChallengeGenerationError`). The assessment workspace cannot be generated.

## Reproduction

1. Open the Practice Setup screen at `http://localhost:3000`.
2. Select only `HTML5` (or `HTML5` and `CSS3`). Ensure `JavaScript`, `TypeScript`, `React`, and `Node.js` are deselected.
3. Select any difficulty (e.g. `Junior / Beginner`).
4. Click "Launch Assessment Workspace".
5. Observe pre-validation failure after retry indicating `<script>` tags, `script.js`, and test files (`.test.js`) are flagged as violations.

## Suspected Code Paths

- `packages/ai/src/prompts/challengePrompt.ts:14-55` — `buildChallengePrompt` does not provide an explicit negative constraint for HTML-only selections forbidding `.js` implementation files and `<script>` tags. Furthermore, its static JSON example unconditionally shows `"src/index.js"` in `starterFiles`, causing the LLM to generate `script.js` even for pure HTML challenges.
- `apps/api/src/features/challenge/services/technology-leak-detector.service.ts:24-47` — `TechnologyLeakDetector` checks `files` for `htmlCssOnly` and unconditionally rejects any `.js` or `.ts` file without distinguishing between candidate implementation files (`starterFiles` / `canonicalSolution`) and automated runner test files (`tests/public/*.test.js`, `tests/private/*.test.js`).
- `apps/api/src/features/challenge/services/pre-validation.service.ts:28-48` — `PreValidationService` aggregates all files into `allFiles` (including public and private Vitest test files) and passes them into `TechnologyLeakDetector`, causing the runner's own DOM test suites to be rejected as a technology leak.

## Root Cause Hypothesis

**Confidence: High**

There is a dual root cause:
1. **Prompt Generation Guidance**: In `packages/ai/src/prompts/challengePrompt.ts`, when `HTML` (or `HTML` + `CSS`) is selected without `JavaScript`, the prompt lacks an explicit instruction instructing the model that candidate workspace files must strictly be `.html` / `.css` only, with no `script.js` and no `<script>` tags. The hardcoded prompt example (`"src/index.js"`) further induces the model to generate a script file.
2. **Leak Detection Scope on Vitest Test Files**: The platform uses Vitest (Node.js) in `SandboxRunnerService` to execute automated DOM tests against candidate HTML/CSS. Consequently, test suites (`publicTests` and `privateTests`) are inherently `.js` or `.ts` files (e.g. `tests/public/dom.test.js`). However, `TechnologyLeakDetector` currently iterates over `allFiles` without differentiating candidate code from test suites; it rejects any file ending in `.js` or `.ts`, making it impossible for any HTML-only challenge to pass pre-validation even if the candidate code itself is 100% pure HTML.

## Proposed Remediation

**Preferred**:
1. **Enforce Pure HTML/CSS in Prompts (`packages/ai/src/prompts/challengePrompt.ts`)**:
   - Detect when `(hasHTML || hasCSS) && !hasJS && !hasTS && !hasReact && !hasNode`.
   - Add explicit prompt constraints:
     - Candidate files (`starterFiles` and `canonicalSolution`) MUST NOT contain any `.js`, `.ts`, `.jsx`, or `.tsx` files.
     - `index.html` MUST NOT contain inline or external `<script>` tags.
     - Starter files and canonical solutions must strictly be `.html` and `.css` files.
   - Adjust the JSON structure example for HTML/CSS-only challenges to show `index.html` and `styles.css` instead of `src/index.js`.
2. **Exempt Test Suites from Language Whitelist in `TechnologyLeakDetector` (`apps/api/src/features/challenge/services/technology-leak-detector.service.ts`)**:
   - Differentiate test files (paths beginning with `tests/` or matching `.test.` / `.spec.`) from candidate workspace files.
   - For `htmlCssOnly`:
     - Strictly enforce that candidate workspace files have NO `.js`/`.ts`/`.jsx`/`.tsx` files and NO `<script>` tags in HTML.
     - Allow test files (`tests/**`) to be `.js`/`.ts` so Vitest can execute DOM assertions using JSDOM.
3. **Add and Update Unit Tests**:
   - In `apps/api/src/features/challenge/__tests__/technology-leak-detector.test.ts`: verify that a challenge with `index.html`, `style.css`, and `tests/public/structure.test.js` passes cleanly without leak violations.
   - In `packages/ai/src/index.test.ts`: verify prompt output contains strict HTML-only constraints and `.html`/`.css` starter files when only HTML is selected.

**Alternatives**:
- Run HTML tests without Node.js (e.g., pure regex HTML validator).
  - *Trade-off*: Would lose rich Vitest assertions, DOM querying, styling checks, and error diffing.

**Files likely to change**:
- `packages/ai/src/prompts/challengePrompt.ts`
- `apps/api/src/features/challenge/services/technology-leak-detector.service.ts`
- `apps/api/src/features/challenge/__tests__/technology-leak-detector.test.ts`
- `packages/ai/src/index.test.ts`

**Tests to add or update**:
- Test in `technology-leak-detector.test.ts` validating that automated test files (`tests/*.test.js`) are permitted in HTML-only challenges while candidate `.js` files remain strictly rejected.
- Test in `packages/ai/src/index.test.ts` asserting HTML-only prompt constraints.

## Risks & Considerations

- **Security & Integrity**: Candidate workspace files (`starterFiles` and `canonicalSolution`) remain 100% strictly pure HTML/CSS with zero scripts. Candidates will not receive or execute JavaScript in their workspace.
- **Pre-validation Execution**: The Vitest runner in `SandboxRunnerService` can load `index.html` via JSDOM and execute the test suite without false-positive leak rejections.

## Open Questions

None. The error logs, prompt structure, and `TechnologyLeakDetector` code paths clearly confirm the cause and remediation.
