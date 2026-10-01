# Tasks: AI-Powered Technical Assessment Platform

**Input**: Design documents from `specs/001-ai-assessment-platform/` (`spec.md`, `plan.md`, `data-model.md`, `research.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/assessment-api.json`, `contracts/challenge-schema.json`, `research.md`

**Organization**: Tasks are strictly grouped by user story and phase to enable independent implementation, automated verification, and incremental delivery.

---

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Task can execute in parallel (different files, no blocking dependency).
- **[Story]**: User story identifier (`[US1]`, `[US2]`, `[US3]`, `[US4]`) mapping directly to `spec.md`.
- All file paths are concrete and project-relative.

---

## Phase 1: Setup (Monorepo & Shared Infrastructure)

**Purpose**: Initialize the Turborepo monorepo workspace, shared configs, and core dependencies.

- [x] T001 Initialize Turborepo monorepo configuration with pnpm workspace in `pnpm-workspace.yaml` and root `package.json`
- [x] T002 [P] Configure shared TypeScript base configuration in `tsconfig.base.json` enforcing strict mode and zero `any` (Constitution Principle I)
- [x] T003 [P] Configure shared Prettier formatting rules in `.prettierrc`
- [x] T004 [P] Initialize `apps/api` Express application structure with TypeScript configuration in `apps/api/package.json` and `apps/api/tsconfig.json`
- [x] T005 [P] Initialize `apps/web` Next.js 14 App Router application with TailwindCSS in `apps/web/package.json` and `apps/web/tsconfig.json`
- [x] T006 [P] Initialize `packages/database` package structure in `packages/database/package.json` and `packages/database/tsconfig.json`
- [x] T007 [P] Initialize `packages/ai` package structure with multi-model provider interface in `packages/ai/package.json` and `packages/ai/tsconfig.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data layer, AI client, error handling, and routing infrastructure required before implementing any user story.

**⚠️ CRITICAL**: Must complete before starting User Story implementation.

- [x] T008 Define Prisma schema models for `AssessmentSession`, `ExerciseDefinition`, `Submission`, and `EvaluationResult` with verbatim constraints in `packages/database/prisma/schema.prisma`
- [x] T009 Generate Prisma client and export typed database singleton instance in `packages/database/src/client.ts`
- [x] T010 [P] Implement Google Gen AI SDK client wrapper using `@google/genai` with Gemini 2.5 in `packages/ai/src/providers/gemini.ts`
- [x] T011 [P] Define `GeneratedProjectChallenge` Zod validation schema matching `contracts/challenge-schema.json` in `packages/ai/src/types.ts`
- [x] T012 [P] Implement domain error hierarchy (`DomainError`, `SessionExpiredError`, `ChallengeGenerationError`, `ValidationError`) in `apps/api/src/shared/errors/domain-errors.ts`
- [x] T013 [P] Implement centralized Express error handling middleware translating domain errors to standardized HTTP JSON envelopes in `apps/api/src/shared/middleware/error-handler.ts`
- [x] T014 Implement Express server bootstrap and feature router composition in `apps/api/src/index.ts` and `apps/api/src/routes.ts`

**Checkpoint**: Core monorepo foundation, database client, AI client, and server routing are operational.

---

## Phase 3: User Story 1 - Configure and Launch an Assessment (Priority: P1) 🎯 MVP

**Goal**: Allow candidates to select target technologies (HTML, CSS, JS, TS, React, Node.js), choose a difficulty, and launch a dynamically generated challenge with an authoritative, non-negotiable countdown timer (20–60 min) to simulate realistic interview pressure.

**Independent Test**: Send `POST /api/assessments` with selected technologies and difficulty; verify that a validated session is created in PostgreSQL with an authoritative duration between 20 and 60 minutes and clean starter code.

### Tests for User Story 1

- [x] T015 [P] [US1] Contract test for `POST /api/assessments` validating request/response schema against `contracts/assessment-api.json` in `apps/api/src/features/assessment/__tests__/assessment-contract.test.ts`
- [x] T016 [P] [US1] Unit test for `ChallengeGeneratorService` verifying strict technology compliance and duration bounds (20-60 min) in `apps/api/src/features/challenge/__tests__/challenge-generator.test.ts`
- [x] T017 [P] [US1] Unit test for `AssessmentService` verifying session creation, state transition (`PENDING` -> `ACTIVE`), and deadline calculation (`expiresAt = startedAt + durationMinutes * 60`) in `apps/api/src/features/assessment/__tests__/assessment-service.test.ts`

### Implementation for User Story 1

- [x] T018 [P] [US1] Define Zod validation schemas for `CreateAssessmentRequest` and `AssessmentSessionResponse` in `apps/api/src/features/assessment/schemas/assessment.schema.ts`
- [x] T019 [P] [US1] Implement `AssessmentRepository` encapsulating all Prisma operations for `AssessmentSession` and `ExerciseDefinition` in `apps/api/src/features/assessment/repositories/assessment.repository.ts`
- [x] T020 [US1] Implement `ChallengeGeneratorService` in `apps/api/src/features/challenge/services/challenge-generator.service.ts` invoking AI client with structured output schema and multi-model support
- [x] T021 [US1] Implement `AssessmentService` in `apps/api/src/features/assessment/services/assessment.service.ts` coordinating challenge generation, duration assignment (20-60 min), and session activation
- [x] T022 [US1] Implement `AssessmentController` handling `POST /api/assessments` and `GET /api/assessments/:id` in `apps/api/src/features/assessment/controllers/assessment.controller.ts`
- [x] T023 [US1] Register assessment routes in `apps/api/src/features/assessment/routes/index.ts` and compose into `apps/api/src/routes.ts`
- [x] T024 [P] [US1] Build Practice Setup UI with technology multi-selector, React dialect selector, difficulty selector, and AI model selector in `apps/web/src/features/assessment/components/PracticeSetup.tsx` and `apps/web/src/app/page.tsx`
- [x] T025 [US1] Connect setup UI to `POST /api/assessments` and navigate candidate to workspace upon session activation in `apps/web/src/features/assessment/hooks/useCreateAssessment.ts`

**Checkpoint**: User Story 1 (MVP) is fully functional. Candidates can configure options and start timed assessments with dynamically generated challenges.

---

## Phase 4: User Story 2 - In-Browser Coding, Public Test Execution & Live Preview (Priority: P1)

**Goal**: Provide an in-browser isolated workspace where candidates can view instructions, edit starter code with locked test/config files, execute public tests on-demand in `< 3s`, view a live visual preview in `< 1s` for UI challenges, and auto-save code revisions every 30 seconds.

**Independent Test**: Load the assessment workspace in browser, modify code, execute public tests to verify real-time pass/fail feedback, inspect live UI updates in the preview pane, and confirm snapshot auto-saving in PostgreSQL via `PUT /api/assessments/:id/snapshot`.

### Tests for User Story 2

- [x] T026 [P] [US2] Contract test for snapshot auto-save `PUT /api/assessments/:id/snapshot` in `apps/api/src/features/assessment/__tests__/snapshot-contract.test.ts`
- [x] T027 [P] [US2] Unit test for `useSessionTimer` validating authoritative countdown synchronizing with server `expiresAt` in `apps/web/src/features/workspace/hooks/__tests__/useSessionTimer.test.ts`

### Implementation for User Story 2

- [x] T028 [P] [US2] Implement snapshot update method in `apps/api/src/features/assessment/repositories/assessment.repository.ts` with conflict checks if session is expired or submitted
- [x] T029 [US2] Implement snapshot endpoint handler in `AssessmentController` for `PUT /api/assessments/:id/snapshot` in `apps/api/src/features/assessment/controllers/assessment.controller.ts`
- [x] T030 [P] [US2] Build Monaco Editor integration with multi-file tabs and read-only protection for test/config files in `apps/web/src/features/workspace/components/MonacoEditor.tsx`
- [x] T031 [P] [US2] Build File Tree navigation component in `apps/web/src/features/workspace/components/FileTree.tsx`
- [x] T032 [US2] Implement WebContainers runner service for executing public Vitest/Jest suites in the browser in `apps/web/src/features/workspace/services/webcontainer-runner.ts`
- [x] T033 [P] [US2] Build Test Console output component displaying real-time pass/fail assertions and errors in `apps/web/src/features/workspace/components/TestConsole.tsx`
- [x] T034 [P] [US2] Build Live Preview pane component using an isolated iframe for real-time DOM/style rendering in `apps/web/src/features/preview/components/LivePreviewFrame.tsx`
- [x] T035 [US2] Implement `useAutoSave` hook dispatching periodic code snapshots every 30 seconds in `apps/web/src/features/workspace/hooks/useAutoSave.ts`
- [x] T036 [US2] Assemble complete Assessment Workspace screen composing editor, file tree, test runner, live preview, and timer in `apps/web/src/app/assessment/[id]/page.tsx`

**Checkpoint**: Candidates can code inside the in-browser workspace, run public tests on-demand, see real-time UI updates, and have their work auto-saved periodically.

---

## Phase 5: User Story 3 - Timed Submission, Private Evaluation, Scorecard & Speed Drill (Priority: P1)

**Goal**: Enforce countdown expiration, allow manual or auto-submission, execute private tests in an isolated server sandbox, render a comprehensive formative scorecard with failure causes and AI speed advice, and provide a "Speed Drill Retry" option.

**Independent Test**: Submit a solution via `POST /api/assessments/:id/submit`, verify private test execution in the isolated sandbox, fetch `GET /api/assessments/:id/results` to inspect the 0-100 score and AI feedback, and trigger `POST /api/assessments/:id/speed-drill` to verify a fresh attempt with clean code and a new timer.

### Tests for User Story 3

- [x] T037 [P] [US3] Contract test for submission `POST /api/assessments/:id/submit` and results `GET /api/assessments/:id/results` in `apps/api/src/features/evaluation/__tests__/evaluation-contract.test.ts`
- [x] T038 [P] [US3] Unit test for server sandbox runner validating timeout enforcement (5s limit) and memory isolation in `apps/api/src/features/evaluation/__tests__/sandbox-runner.test.ts`
- [x] T039 [P] [US3] Unit test for `SpeedDrillService` validating exercise reuse, clean starter reset, and new session creation in `apps/api/src/features/assessment/__tests__/speed-drill.test.ts`

### Implementation for User Story 3

- [x] T040 [P] [US3] Implement `SandboxRunnerService` in `apps/api/src/features/evaluation/services/sandbox-runner.service.ts` executing private tests with 5s timeout and 256MB memory cap
- [x] T041 [US3] Implement `EvaluationService` in `apps/api/src/features/evaluation/services/evaluation.service.ts` aggregating test pass/fail results, computing score (0-100), and invoking Gemini for pedagogical feedback
- [x] T042 [P] [US3] Implement `EvaluationRepository` in `apps/api/src/features/evaluation/repositories/evaluation.repository.ts` persisting `Submission` and `EvaluationResult`
- [x] T043 [US3] Implement `SubmissionController` handling `POST /api/assessments/:id/submit` with deadline verification (`now <= expiresAt + 5s`) in `apps/api/src/features/assessment/controllers/submission.controller.ts`
- [x] T044 [US3] Implement `SpeedDrillController` handling `POST /api/assessments/:id/speed-drill` in `apps/api/src/features/assessment/controllers/speed-drill.controller.ts`
- [x] T045 [P] [US3] Build Formative Scorecard component displaying overall score, passed/failed private test breakdown with error diffs, and AI speed guidance in `apps/web/src/features/evaluation/components/Scorecard.tsx`
- [x] T046 [US3] Build Assessment Results Page with "New Challenge" and "Speed Drill Retry" action buttons in `apps/web/src/app/(private)/assessment/[id]/results/page.tsx`
- [x] T047 [US3] Implement auto-timeout modal and automatic submission trigger when countdown timer hits 00:00 in `apps/web/src/features/workspace/components/TimeoutModal.tsx`

**Checkpoint**: End-to-end evaluation loop complete. Private tests evaluate securely, results render with actionable AI advice, and speed drill retries allow candidates to beat the clock.

---

## Phase 6: User Story 4 - Strict Technology & Pre-Validation Quality Gates (Priority: P2)

**Goal**: Guarantee that 100% of generated challenges strictly respect the requested technology stack (no unselected tech dependencies) and pre-validate that the canonical solution passes all public and private tests before presenting the exercise to the candidate.

**Independent Test**: Generate a challenge for HTML/CSS only and verify via automated checks that no JavaScript/Node/TypeScript files or dependencies exist; execute the pre-validation service on a canonical solution and confirm it gates challenge presentation.

### Tests for User Story 4

- [x] T048 [P] [US4] Unit test for `TechnologyLeakDetector` validating that unselected technologies are flagged and rejected in `apps/api/src/features/challenge/__tests__/technology-leak-detector.test.ts`
- [x] T049 [P] [US4] Unit test for `PreValidationService` verifying that flawed canonical solutions trigger regeneration in `apps/api/src/features/challenge/__tests__/pre-validation.test.ts`

### Implementation for User Story 4

- [x] T050 [P] [US4] Implement `TechnologyLeakDetector` in `apps/api/src/features/challenge/services/technology-leak-detector.service.ts` inspecting generated file manifests and package configs against the allowed technology whitelist
- [x] T051 [US4] Implement `PreValidationService` in `apps/api/src/features/challenge/services/pre-validation.service.ts` running canonical solutions through the sandbox runner prior to saving `ExerciseDefinition` with `validationStatus = VERIFIED`
- [x] T052 [US4] Integrate pre-validation gate into `ChallengeGeneratorService` with automatic single retry if canonical tests fail or leaks are detected in `apps/api/src/features/challenge/services/challenge-generator.service.ts`

**Checkpoint**: Quality gates active. Zero unselected tech dependencies leak, and every presented challenge is verified solvable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, performance optimization, security hardening, and final verification.

- [x] T053 [P] Execute end-to-end validation scenarios documented in `specs/001-ai-assessment-platform/quickstart.md`
- [x] T054 [P] Verify performance latency thresholds: challenge generation < 15s (SC-002), public tests < 3s (SC-003), evaluation < 10s (SC-004), live preview < 1s (SC-007)
- [x] T055 [P] Security audit of sandbox execution ensuring `--net=none`, memory caps, and zero exposure of host environment variables or secrets
- [x] T056 Code cleanup, formatting verification with ESLint/Prettier, and documentation updates across monorepo

---

## Dependencies & Execution Order

### Phase Dependencies

```mermaid
flowchart TD
    P1[Phase 1: Setup] --> P2[Phase 2: Foundational]
    P2 --> P3[Phase 3: User Story 1 - Configure & Launch 🎯 MVP]
    P3 --> P4[Phase 4: User Story 2 - Workspace & Live Preview]
    P4 --> P5[Phase 5: User Story 3 - Submission & Speed Drill]
    P3 --> P6[Phase 6: User Story 4 - Quality Gates & Pre-Validation]
    P5 --> P7[Phase 7: Polish & Cross-Cutting]
    P6 --> P7
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 1 & 2. Standalone MVP delivering practice session creation, AI generation, and authoritative timers.
- **User Story 2 (P1)**: Depends on US1 (requires active session manifest). Delivers in-browser editing, public test execution, and live preview.
- **User Story 3 (P1)**: Depends on US1 & US2 (requires workspace code to submit). Delivers private evaluation, scorecard, and speed drill retry.
- **User Story 4 (P2)**: Extends US1 generation pipeline with automated canonical pre-validation and technology leak checks.

### Parallel Execution Opportunities

- **Phase 1**: Tasks T002, T003, T004, T005, T006, T007 can execute concurrently.
- **Phase 2**: Tasks T010, T011, T012, T013 can execute concurrently once T008-T009 are established.
- **Phase 3 (US1)**: Tests T015, T016, T017 and schemas/repositories T018, T019, T024 can execute in parallel.
- **Phase 4 (US2)**: MonacoEditor T030, FileTree T031, TestConsole T033, and LivePreviewFrame T034 can be built concurrently.
- **Phase 5 (US3)**: SandboxRunner T040, EvaluationRepository T042, and Scorecard UI T045 can execute in parallel.

---

## Implementation Strategy (MVP & Incremental Delivery)

1. **MVP Delivery (Phases 1, 2, 3)**:
   - Establish monorepo and foundational services.
   - Deliver User Story 1: Candidate selects technologies, AI generates challenge, session starts with authoritative timer.
   - **Validate & Demo MVP**: Verify challenge generation and session initialization via API and practice setup screen.

2. **Interactive Workspace Increment (Phase 4)**:
   - Deliver Monaco editor, WebContainers public test runner, and Live Preview.
   - Candidates can now write and test code interactively in the browser.

3. **Complete Evaluation & Speed Training Increment (Phase 5)**:
   - Deliver private test sandbox evaluation, formative scorecards with AI advice, and Speed Drill retries.
   - Candidates can now train speed and measure progress across attempts.

4. **Quality Gates Hardening (Phase 6 & 7)**:
   - Deliver canonical pre-validation and technology leak detection.
   - Execute quickstart scenarios and verify performance SLAs.

---

## Phase 8: Convergence

- [x] T057 [P] Integrate `modelId` selection parameter into `CreateAssessmentRequest` Zod schema in `apps/api/src/features/assessment/schemas/assessment.schema.ts` and Next.js practice setup dropdown UI in `apps/web/src/features/assessment/components/ModelSelector.tsx` per user requirement (partial)



## Phase 9: Convergence

- [x] T058 CRITICAL Enforce runtime route parameter validation with Zod schemas in controllers (`assessment.controller.ts`, `submission.controller.ts`, `speed-drill.controller.ts`) and resolve index narrowing in `sandbox-runner.test.ts` to ensure 100% type safety and clean `tsc --noEmit` per Constitution I & XII (contradicts)
- [x] T059 Extend `GenerateChallengeParams` in `packages/ai`, forward `reactDialect` in `ChallengeGeneratorService.generate()`, and inject explicit dialect instructions into `buildChallengePrompt()` per FR-002 and US1/AC2 (partial)
- [x] T060 Update default AI model instantiation in `EvaluationService` constructor to `'gemini-3-flash-preview'` per plan: AI model provider architecture (partial)
