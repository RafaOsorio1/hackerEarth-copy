# Implementation Plan: AI-Powered Technical Assessment Platform

**Branch**: `001-ai-assessment-platform` | **Date**: 2026-10-01 | **Spec**: [specs/001-ai-assessment-platform/spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-assessment-platform/spec.md`

## Summary

Build an AI-powered technical assessment platform simulating HackerEarth/Codility timed coding challenges. The platform dynamically generates self-contained engineering challenges tailored to candidate-selected stacks (HTML, CSS, JavaScript, TypeScript, React, Node.js), pre-validates them against canonical solutions, presents them inside an in-browser isolated workspace with real-time public test execution and Live Preview, enforces strict non-negotiable countdown timers (20–60 min), and objectively evaluates submissions against private test suites in a secure sandbox, delivering a formative scorecard and speed-drill retry capability.

---

## Technical Context

**Language/Version**: TypeScript 5.5+ (Node.js 20+ runtime for API and WebContainers in frontend).

**Primary Dependencies**:
- Backend (`apps/api`): Express.js, `@google/genai` (Gemini 2.5 SDK), `@prisma/client`, `zod`, `uuid`.
- Frontend (`apps/web`): Next.js 15+ (App Router), React 19, `@monaco-editor/react`, `@webcontainer/api`, TailwindCSS, `lucide-react`.
- Shared Packages (`packages/*`): `packages/database` (Prisma ORM), `packages/ai` (Gemini structured challenge generator).

**Storage**: PostgreSQL 16+ via Prisma ORM for session state, challenge manifests, submission snapshots, and evaluation results.

**Testing**: Vitest for backend unit/integration tests and in-browser test execution; Playwright for end-to-end browser user journeys.

**Target Platform**: Modern web browsers (Chrome, Edge, Firefox, Safari) with WebAssembly and WebWorker support for client sandbox, hosted on Linux container backend.

**Project Type**: Monorepo Web Application (`apps/web` frontend, `apps/api` backend, `packages/database`, `packages/ai`).

**Performance Goals**:
- Dynamic challenge generation & pre-validation < 15 seconds (SC-002).
- In-browser public test feedback < 3 seconds (SC-003).
- Private test evaluation & score report < 10 seconds post-submission (SC-004).
- Live preview DOM/style rendering updates < 1 second (SC-007).

**Constraints**:
- Absolute prohibition of the `any` type (Constitution Principle I).
- Zero leakage of private test files or canonical solutions to candidate browser (SC-005).
- Candidate submissions arriving after authoritative session deadline (`expiresAt + 5s`) must be rejected (SC-006).
- Strict execution resource limits on evaluation worker: 5s execution timeout, 256MB memory cap, zero network access.

**Scale/Scope**: Single-user standalone practice assessments, support for 6 core web technologies, extensible to interactive SQL didactic exercises.

---

## Constitution Check

*GATE: All gates evaluated against the HackerEarth-Copy Constitution (v1.0.0).*

| Constitution Gate / Principle | Status | Architectural Justification & Compliance Mechanism |
|-------------------------------|--------|-----------------------------------------------------|
| **1. Type Safety First** (Principle I) | **PASSED** | TypeScript strict mode enforced across monorepo. Zod schemas validate all HTTP request payloads, route params, and AI structured outputs. Zero `any` or unsafe assertions. |
| **2. Clean Structure & Layered Architecture** (Principles II, III, IV, V) | **PASSED** | Backend features encapsulate `routes/`, `controllers/`, `services/` (use cases), and `repositories/`. Business logic never accesses HTTP request objects or direct Prisma client. |
| **3. Feature-Based Routing** (Principle IV) | **PASSED** | Features expose local routers (`routes/index.ts`) composed into the main application router with resource paths (`/api/assessments/*`). |
| **4. Separation of Responsibilities** (Principle V) | **PASSED** | Thin controllers orchestrate request parsing and response mapping. Services handle generation, evaluation, and timer calculations. Repositories handle database persistence. |
| **5. Error Handling & API Contracts** (Principles VII, X) | **PASSED** | Typed domain errors (`SessionExpiredError`, `ChallengeGenerationError`). HTTP boundary translates domain errors into consistent JSON envelopes (`contracts/assessment-api.json`). |
| **6. Testing & Definition of Done** (Principles VIII, XII) | **PASSED** | Automated unit tests for use cases, integration tests for API endpoints, and sandbox tests verifying isolated execution. |
| **7. Language & Communication** (Principle XIII) | **PASSED** | All source code, identifiers, schemas, API contracts, and documentation are written in English; developer communication conducted in Spanish. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-assessment-platform/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Technology decisions & sandbox analysis
├── data-model.md        # Entities, relational models & state machines
├── quickstart.md        # End-to-end validation scenarios
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── contracts/
    ├── assessment-api.json     # OpenAPI 3.1 contract
    └── challenge-schema.json   # Gemini JSON Schema for structured outputs
```

### Source Code (Monorepo Layout)

```text
apps/
├── api/                                      # Express Backend Service
│   ├── src/
│   │   ├── features/
│   │   │   ├── assessment/                   # Assessment Session Feature Domain
│   │   │   │   ├── controllers/              # AssessmentController (thin HTTP gatekeeper)
│   │   │   │   ├── services/                 # AssessmentService, TimerService
│   │   │   │   ├── repositories/             # AssessmentRepository (Prisma access)
│   │   │   │   ├── schemas/                  # Zod validation schemas
│   │   │   │   ├── types/                    # Domain types and interfaces
│   │   │   │   ├── routes/                   # routes/index.ts (feature router entry point)
│   │   │   │   └── __tests__/                # Unit & integration tests
│   │   │   ├── challenge/                    # Dynamic Challenge Generation Domain
│   │   │   │   ├── services/                 # ChallengeGeneratorService, PreValidationService
│   │   │   │   ├── repositories/             # ChallengeRepository
│   │   │   │   └── __tests__/
│   │   │   └── evaluation/                   # Evaluation & Scoring Domain
│   │   │       ├── services/                 # EvaluationService, SandboxRunnerService
│   │   │       ├── repositories/             # EvaluationRepository
│   │   │       └── __tests__/
│   │   ├── shared/                           # Shared backend utilities
│   │   │   ├── errors/                       # DomainError base classes
│   │   │   └── middleware/                   # ErrorHandler, RequestLogger
│   │   ├── routes.ts                         # Composed top-level router
│   │   ├── server.ts                         # Express app entry point
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── web/                                      # Next.js 15 Frontend
    ├── src/
    │   ├── app/                              # Next.js App Router
    │   │   ├── (public)/                     # Public marketing/landing routes
    │   │   ├── (private)/                    # Authenticated candidate areas
    │   │   │   ├── practice/                 # Setup & configuration screen
    │   │   │   └── assessment/[id]/          # Active assessment workspace & scorecard
    │   │   │       ├── page.tsx
    │   │   │       └── results/page.tsx
    │   │   ├── layout.tsx
    │   │   └── globals.css
    │   ├── features/                         # Frontend domain features
    │   │   ├── workspace/                    # In-browser code workspace
    │   │   │   ├── components/               # MonacoEditor, FileTree, TerminalConsole
    │   │   │   ├── hooks/                    # useWebContainer, useAutoSave, useSessionTimer
    │   │   │   └── services/                 # WebContainerRunner
    │   │   ├── preview/                      # Live UI Preview feature
    │   │   │   └── components/               # LivePreviewFrame (isolated iframe renderer)
    │   │   └── evaluation/                   # Results & Scorecard feature
    │   │       └── components/               # Scorecard, TestBreakdown, FeedbackView
    │   └── lib/                              # Client HTTP api fetchers & helpers
    ├── package.json
    └── tsconfig.json

packages/
├── database/                                 # Prisma Database Package
│   ├── prisma/
│   │   └── schema.prisma                     # PostgreSQL schema
│   ├── src/
│   │   └── client.ts                         # Exported typed PrismaClient singleton
│   ├── package.json
│   └── tsconfig.json
│
└── ai/                                       # AI Integration Package
    ├── src/
    │   ├── gemini-client.ts                  # Google Gen AI SDK wrapper
    │   ├── prompts/                          # System prompts for challenge generation & feedback
    │   ├── schemas/                          # GeneratedChallengeSchema (Zod & JSON Schema)
    │   └── types/                            # Type contracts
    ├── package.json
    └── tsconfig.json
```

**Structure Decision**: Selected a modular Turborepo monorepo separating `apps/web` (Next.js candidate interface with WebContainers and Monaco) and `apps/api` (Express backend strictly adhering to the 4-layer feature architecture). Shared persistence resides in `packages/database` and shared AI generation logic in `packages/ai`.

---

## Complexity Tracking

> **Constitution Check Violations**: NONE.
> The architectural design strictly adheres to all 13 constitutional principles, including full type safety, layered feature encapsulation, declarative error boundaries, and sandbox isolation.
