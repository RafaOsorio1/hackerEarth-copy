# Research & Technology Decisions: AI-Powered Technical Assessment Platform

**Feature**: `specs/001-ai-assessment-platform`
**Date**: 2026-10-01
**Status**: Completed

This document records the architectural investigations, technology evaluations, and concrete technical decisions for implementing the AI-Powered Technical Assessment Platform according to the project constitution.

---

## 1. AI Challenge Generation & Deterministic Structured Output

### Context & Challenge
The platform must dynamically generate complete, self-contained coding exercises strictly respecting the user's selected technology stack (HTML, CSS, JavaScript, TypeScript, React, Node.js). Each generated challenge must include clear instructions, starter code files, public test files, private test files, and a canonical working solution that passes all tests. This entire process must execute and validate in under 15 seconds (SC-002).

### Decision
Use **Google Gemini 2.5** via the official SDK (`@google/genai`) configured with **Structured Outputs** (`responseSchema` enforcing a strict JSON Schema). 

The generation pipeline follows a 2-step process:
1. **Schema-Constrained Generation**: Prompting Gemini with a system prompt detailing the target stack, difficulty, time budget (20–60 min), and exact schema (`GeneratedChallengeSchema`).
2. **Canonical Pre-Validation**: The backend executes the canonical solution against both public and private test suites in an isolated validation runner before returning the challenge to the candidate. If verification fails, a single automatic regeneration is triggered.

### Schema Structure (`GeneratedChallengeSchema`)
- `title`: string
- `description`: markdown string (problem statement, requirements, constraints)
- `technologies`: array of string (subset of selected technologies)
- `difficulty`: enum (`Beginner`, `Intermediate`, `Advanced`)
- `estimatedDurationMinutes`: integer (20 to 60)
- `starterFiles`: array of `{ path: string, content: string, readOnly: boolean }`
- `publicTests`: array of `{ path: string, content: string }`
- `privateTests`: array of `{ path: string, content: string }`
- `canonicalSolution`: array of `{ path: string, content: string }`

### Rationale
- Structured Outputs guarantee 100% syntactically valid JSON responses, eliminating markdown parsing errors and regex fragility.
- Bounding generation parameters inside the schema prevents hallucinations (e.g., requesting Python or importing external unselected packages).
- Pre-validation of the canonical solution guarantees candidate trust by ensuring 0% of delivered challenges contain unsolvable tests.

### Alternatives Considered
- *Unstructured Markdown parsing*: Rejected due to frequent syntax errors, unescaped code blocks, and lack of deterministic typing.
- *Pre-baked static challenge database*: Rejected because the core requirement is dynamic, endless practice variety tailored to arbitrary technology combinations.

---

## 2. In-Browser Workspace, Test Runner & Live Preview

### Context & Challenge
Candidates need to inspect files, edit starter code, view a live visual preview for UI challenges (HTML, CSS, React), and run public tests on demand with feedback under 3 seconds (SC-003) and preview updates under 1 second (SC-007), all without local environment setup.

### Decision
Implement a client-side execution workspace utilizing **WebContainers (StackBlitz API)** for Node.js/React/TypeScript challenges and a secure sandboxed `<iframe>` for static HTML/CSS/Vanilla JS challenges.

- **Editor**: Monaco Editor (VS Code in-browser engine) supporting syntax highlighting, TypeScript IntelliSense, and file-tree navigation.
- **File System**: In-memory virtual file system synced with WebContainers.
- **Public Test Runner**: Executes tests directly within the browser's WebContainer using `vitest` / `jest` in under 3 seconds.
- **Live Preview**: An isolated iframe listening to file updates via postMessage or local WebContainer HTTP dev server, hot-reloading DOM and style updates in < 1 second.
- **File Immutability**: Test files (`*.test.ts`, `*.spec.js`) and environment configs (`package.json`, `tsconfig.json`) are marked `readOnly: true` in Monaco Editor to preserve test integrity.

### Rationale
- Zero server compute overhead for candidate typing, auto-saving, and public test running.
- Sub-second feedback loop aligns with the user's need to train speed and agility.
- WebContainers run real Node.js and npm packages inside WebAssembly within the browser sandbox, providing complete security and process isolation.

### Alternatives Considered
- *Remote Docker containers per candidate*: Rejected due to high infrastructure cost, cold-start latency (>10s), and inability to meet the 3-second public test execution SLA.
- *Web Workers without DOM*: Rejected because UI challenges (React, HTML/CSS) require DOM manipulation and layout rendering.

---

## 3. Private Test Evaluation & Secure Scoring

### Context & Challenge
Private tests must never leak to the candidate's browser before submission (SC-005). Upon manual submission or timer expiration, private tests must be executed against the candidate's code in a secure sandbox, producing a numerical score (0-100), detailed test results, and pedagogical AI feedback in under 10 seconds (SC-004).

### Decision
Perform private test evaluation **server-side** inside an isolated execution environment:
1. Candidate submits their final code manifest (or the server captures the latest auto-saved snapshot at expiry).
2. The server-side evaluation worker merges the candidate's submitted files with the private test suite (kept strictly in server storage).
3. The worker executes the tests inside an isolated sandbox with strict resource limits:
   - Max execution timeout: 5,000 ms (5 seconds).
   - Memory ceiling: 256 MB.
   - Network access: completely disabled (`--net=none`).
4. Assertion results are aggregated:
   - Passed/failed count calculated.
   - For failed tests: test name, assertion error message, expected vs received values captured.
5. An asynchronous AI prompt generates structured pedagogical feedback analyzing code efficiency, edge cases missed, and concrete speed tips.

### Rationale
- Completely prevents private test leakage; the candidate's browser receives test names and assertion failures only after submission is permanently finalized.
- Protects platform infrastructure against infinite loops, memory leaks, or malicious exploits.

### Alternatives Considered
- *Client-side private test execution with encrypted bundle*: Rejected because browser memory and DevTools allow intercepting decrypted strings or monkey-patching `expect()` assertions.

---

## 4. Authoritative Session Timer & State Machine

### Context & Challenge
Candidates must experience authentic interview pressure with non-negotiable countdown timers (20–60 minutes). The system must handle network disconnections, prevent client clock tampering, and reject late submissions while auto-finalizing work on timeout.

### Decision
Implement an authoritative server-side state machine with persistent timestamps:
- **`startedAt`**: Exact UTC timestamp when the session transitions from `Pending` to `Active`.
- **`expiresAt`**: Authoritative UTC deadline (`startedAt + durationMinutes * 60`).
- **Grace Period**: 5-second network transmission window allowed for in-flight requests.
- **Periodic Snapshot Sync**: The browser auto-saves file revisions every 30 seconds.
- **Expiration Trigger**:
  - Client side: At 00:00, the client locks Monaco Editor and invokes `/api/assessments/:id/submit` with `trigger: auto-timeout`.
  - Server side: If no submission is received within 15 seconds after `expiresAt`, a server cron/background worker marks the session as `Submitted` using the latest saved snapshot and triggers evaluation.
  - Any submission arriving after `expiresAt + 5s` is strictly rejected with HTTP 409 Conflict / 403 Forbidden.

### Rationale
- Eliminates client clock spoofing.
- Candidates who lose network connectivity or close the tab still have their saved work evaluated when the timer expires.

---

## 5. Didactic Database / SQL Challenges (Roadmap Research)

### Context & Challenge
As requested in FR-017, database/SQL challenges should not be limited to raw SQL files, but can include didactic, interactive exercises (e.g., entity-relationship mapping, connecting foreign keys, visual query puzzles).

### Decision
Define a modular architecture for **Didactic Database Challenges** to be delivered in a subsequent feature slice:
- **Challenge Type**: `InteractiveDatabaseExercise`.
- **UI Interaction**: Interactive node-based ERD canvas (tables, columns, primary/foreign keys).
- **Evaluation Mechanism**: Schema AST comparison (matching relationships, cardinality, and constraints) and query execution against an in-memory SQLite / PGlite database in the browser.
- **Spike Status**: Conceptualized and documented in the architecture; core code assessment engine (HTML, CSS, JS, TS, React, Node.js) prioritized for Phase 1.

---

## Summary of Technology Stack

| Component | Technology / Library | Rationale |
|-----------|----------------------|-----------|
| **Monorepo Manager** | Turborepo + pnpm | Fast incremental builds, shared packages. |
| **Frontend Framework** | Next.js 15+ (App Router), React 19 | Server Components, optimal performance, SSR. |
| **Styling** | TailwindCSS + Tailwind Typography | Modern UI, responsive layout, rapid styling. |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | Industry-standard VS Code engine in browser. |
| **Client Sandbox** | WebContainers API / Sandboxed iframe | Zero-latency in-browser public testing & Live Preview. |
| **Backend Framework** | Node.js + Express.js (TypeScript) | Clean layered architecture, proven reliability. |
| **Database & ORM** | PostgreSQL + Prisma ORM | Strong relational integrity, type-safe queries. |
| **Schema Validation** | Zod | End-to-end type safety, runtime payload validation. |
| **AI Generation Engine** | Google Gemini 2.5 (`@google/genai`) | Structured Outputs, fast JSON schema compliance. |
| **Test Runner (Internal)** | Vitest | Extremely fast, native TypeScript/ESM support. |
