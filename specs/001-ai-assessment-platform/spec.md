# Feature Specification: AI-Powered Technical Assessment Platform

**Feature Branch**: `001-ai-assessment-platform`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Build an AI-powered technical assessment platform. The platform allows users to practice technical coding assessments similar to timed HackerEarth-style challenges..."

## Clarifications

### Session 2026-10-01
- Q: How should assessment time limits be calibrated? → A: Dynamic AI estimation based on challenge complexity (files, requirements, test count), strictly bounded between 20 minutes (minimum) and 60 minutes (maximum cap; never open-ended or multi-hour sessions).
- Q: What level of detail should the post-submission evaluation report provide? → A: Full formative report: numerical score (0-100), itemized breakdown of passed/failed private tests with specific failure causes and assertion errors, and pedagogical AI feedback on performance, pattern optimization, and speed improvement.
- Q: Should candidates be able to retry the same challenge for speed training? → A: Dual mode: candidates can either generate a new dynamic challenge or trigger a timed "Speed Drill" retry of the same challenge to measure speed and completion improvement against the original timer.
- Q: How should multi-technology challenges be structured in the generated repository? → A: Single integrated mini-project: a cohesive application where the selected technologies interact naturally (e.g., React UI communicating with a Node.js API), evaluated as a unified solution rather than disjoint tasks.
- Q: Should UI challenges (HTML, CSS, React) feature a live visual preview? → A: Live visual preview panel: the in-browser workspace includes a real-time rendering pane alongside the code editor and test console whenever the challenge involves UI technologies (HTML, CSS, React).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure and Launch an Assessment (Priority: P1)

As a practicing developer preparing for real interviews, I want to select my target technologies and difficulty level, and have the platform assign a challenge with an authentic, non-negotiable time limit so that I can train under realistic technical interview pressure.

**Why this priority**: Without the ability to configure and launch an exercise, the core practice workflow cannot function. Furthermore, authentic interview pressure requires the challenge itself to dictate the time constraint rather than letting candidates arbitrarily set generous timers.

**Independent Test**: Can be tested by selecting specific technologies (e.g., React with TypeScript, or HTML/CSS/NodeJS) and a difficulty level, launching the assessment, and confirming that the platform initiates an isolated session with an exercise and an assessment-determined countdown timer tailored to the challenge scope.

**Acceptance Scenarios**:

1. **Given** a candidate is on the assessment setup screen, **When** they select target technologies (e.g., Node.js and TypeScript) and choose a difficulty level (e.g., "Intermediate"), **Then** the platform creates an assessment session, calculates and locks an assessment-determined duration (e.g., 35 minutes based on challenge complexity), starts the authoritative countdown, and loads the corresponding isolated workspace.
2. **Given** a user selects React, **When** prompted for language dialect, **Then** the user can choose either JavaScript or TypeScript, and the resulting exercise strictly uses the chosen dialect.
3. **Given** a user is configuring an assessment, **When** they review the setup screen, **Then** they cannot manually override or extend the time limit, ensuring authentic assessment pressure.
4. **Given** a user leaves required options unselected, **When** they attempt to start, **Then** the system prevents session creation and highlights the missing selections.

---

### User Story 2 - In-Browser Coding and Public Test Execution (Priority: P1)

As a candidate taking an assessment, I want to view clear exercise instructions, edit starter code within an isolated workspace, and run public tests on demand so that I can iteratively verify my solution before submitting.

**Why this priority**: Real-time feedback via public tests allows candidates to gauge their progress and fix regressions independently during the timed assessment.

**Independent Test**: Can be tested by opening an active assessment session, modifying a starter code file, triggering public test execution, and observing immediate test pass/fail output without affecting private assessment evaluation.

**Acceptance Scenarios**:

1. **Given** an active assessment session, **When** the candidate opens the workspace, **Then** they see the exercise description, instructions, starter code files, and public test files.
2. **Given** a candidate has modified code to satisfy a public test, **When** they trigger "Run Tests", **Then** the system executes the public test suite in an isolated sandbox and displays test results (passed, failed, error messages) within seconds.
3. **Given** the candidate is working in the workspace, **When** they inspect the workspace and test runner, **Then** private evaluation tests are completely hidden and inaccessible.
4. **Given** an exercise involves UI technologies (HTML, CSS, React), **When** the candidate edits starter code, **Then** a live visual preview pane renders the interactive application alongside the code editor, updating automatically as code is modified.

---

### User Story 3 - Timed Submission, Private Evaluation & Feedback (Priority: P1)

As an assessment candidate, I want to submit my solution before the time limit expires (or have it automatically finalized upon expiration) and receive an objective score based on private tests and qualitative feedback.

**Why this priority**: The ultimate goal of an assessment platform is evaluating candidate performance objectively and providing actionable feedback.

**Independent Test**: Can be tested by submitting a completed exercise within the time window and verifying that private test suites execute in isolation, yielding a final score and detailed report.

**Acceptance Scenarios**:

1. **Given** an active assessment with remaining time, **When** the candidate clicks "Submit Solution", **Then** the platform locks the workspace from further editing, runs the private test suite, and presents a comprehensive scorecard displaying percentage score, itemized private test results with failure causes, and pedagogical AI feedback on performance and speed optimization.
2. **Given** an active assessment countdown reaches 00:00, **When** the timer expires, **Then** the assessment ends automatically, accepts no further manual edits, and evaluates the final saved state of the solution.
3. **Given** an assessment has ended, **When** an external or late submission request is attempted, **Then** the platform rejects the submission with a clear error indicating the time window has closed.
4. **Given** an evaluation report has been reviewed, **When** the candidate clicks "Speed Drill Retry", **Then** the platform reloads the exact same exercise reset to its initial starter state with a fresh authoritative countdown timer, enabling direct speed and completion improvement practice.

---

### User Story 4 - Strict Technology and Quality Boundary Validation (Priority: P2)

As a platform administrator and learner, I want generated exercises to be rigorously pre-validated so that no exercise requires unselected technologies, contains broken starter code, or exposes unreliable test suites.

**Why this priority**: If an AI-generated assessment introduces unselected dependencies (e.g., introducing TypeScript or Node modules into an HTML/CSS challenge) or generates unsolvable tests, candidate trust is compromised.

**Independent Test**: Can be tested by configuring narrow technology constraints (e.g., HTML + CSS only) and verifying that 100% of generated files, instructions, and tests contain zero references or runtime requirements for unselected technologies.

**Acceptance Scenarios**:

1. **Given** a user requested HTML and CSS only, **When** an exercise is generated, **Then** the system validates that no JavaScript, TypeScript, or external scripting frameworks are included in the instructions, starter code, or test runners.
2. **Given** an exercise is newly generated, **When** pre-validation executes before candidate presentation, **Then** the platform confirms the canonical reference solution passes all public and private tests; if verification fails, the exercise is regenerated automatically before the candidate sees it.

---

### Edge Cases

- **Timer Expiration During Active Keystrokes**: What happens if the timer hits zero while the user is actively typing? The system automatically finalizes the session using the most recently synchronized code snapshot, transitions to the "Evaluating" state, and disables all editor inputs.
- **Network Interruption During Assessment**: How does the system handle temporary client disconnections? The server-side timer continues running accurately. When the user reconnects, the remaining time reflects the true server elapsed time, and their latest saved code is restored.
- **Malicious or Resource-Exhaustive Code Execution**: How does the system prevent infinite loops, memory exhaustion, or attempted access to host credentials in user-submitted code? All code execution occurs within an isolated, sandboxed environment with strict CPU quotas, execution timeouts (e.g., 5 seconds per test run), and zero network access to internal platform secrets or other tenant data.
- **Incompatible Technology Combination**: What happens if a user selects an incoherent combination of options (e.g., React without specifying JavaScript or TypeScript)? The configuration UI blocks submission and prompts the user to select the required pairing.
- **Unbounded Challenge Duration**: How does the platform ensure generated challenges do not produce excessively long time commitments? The assessment generator enforces hard duration guardrails (minimum 20 minutes, maximum 60 minutes). Challenges with estimated time requirements outside this range are rejected or automatically rescoped during pre-validation.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to select one or multiple technologies for their assessment from a supported catalog (HTML, CSS, JavaScript, TypeScript, React, Node.js).
- **FR-002**: When React is selected, the system MUST require the user to explicitly specify whether the language dialect is JavaScript or TypeScript.
- **FR-003**: The assessment duration MUST be dynamically calculated by the AI engine based on challenge complexity (scope of files, requirements, and test suites), bounded strictly between a minimum of 20 minutes and a maximum ceiling of 60 minutes; candidates MUST NOT configure, extend, or override this limit, ensuring authentic interview time pressure.
- **FR-004**: The system MUST dynamically generate a unique, self-contained coding challenge that strictly conforms to the user's selected technologies and difficulty level; when multiple technologies are chosen (e.g., React + TypeScript + Node.js), the exercise MUST be structured as a single integrated mini-project where components and services interact coherently and are evaluated as a unified application.
- **FR-005**: Generated exercises MUST NOT require, import, or evaluate any technology or library not explicitly selected by the user.
- **FR-006**: Generated exercises MUST include comprehensive user-facing instructions, starter code files, and public automated test files.
- **FR-007**: Generated exercises MUST include a distinct private automated test suite that is strictly excluded from the user-facing workspace.
- **FR-008**: Before an exercise is presented to a user, the system MUST automatically validate that the exercise's canonical solution passes both public and private test suites.
- **FR-009**: The system MUST provide an isolated workspace where the user can inspect files, write code, and trigger on-demand execution of the public test suite.
- **FR-010**: Public test execution results (passed test count, failed test names, assertion error messages) MUST be returned to the user interface in real time.
- **FR-011**: The system MUST maintain an authoritative server-side countdown timer for each active assessment session based on the challenge-assigned duration.
- **FR-012**: When the assessment timer expires, the system MUST automatically terminate the session, lock the workspace against further edits, and transition the assessment to evaluation.
- **FR-013**: The system MUST reject any submission received after the authoritative session timer has expired.
- **FR-014**: Upon submission (manual or timer-triggered), the system MUST execute the private test suite against the submitted code in a secure sandbox.
- **FR-015**: The evaluation engine MUST calculate a percentage score based on private test assertions and generate a comprehensive formative report that displays: (1) overall score (0-100), (2) itemized list of all private tests with pass/fail status and specific assertion failure errors for failed tests, and (3) actionable pedagogical feedback from the AI highlighting code efficiency, edge case oversights, and speed optimization advice.
- **FR-016**: User-submitted code MUST execute in a sandboxed runtime environment with restricted capabilities, resource ceilings (CPU and memory limits), and total isolation from platform credentials and internal services.
- **FR-017**: The platform architecture MUST support database technologies (e.g., SQL), accommodating didactic and interactive exercise modalities (such as entity relationship matching, schema connection puzzles, and query validation); detailed interaction patterns for didactic database challenges will be refined through a dedicated UX research spike.
- **FR-018**: Upon reviewing the evaluation report, the system MUST allow the candidate to either (a) generate a new dynamic assessment for their selected stack, or (b) initiate a "Speed Drill" retry of the same challenge, resetting the workspace to its clean starter state with a fresh authoritative countdown timer to practice speed and completion.
- **FR-019**: For exercises involving user interface technologies (HTML, CSS, React), the in-browser workspace MUST provide a live visual preview pane that renders the application in real time alongside the code editor and test runner output.

---

### Key Entities

- **AssessmentSession**: Represents an individual test-taking instance. Attributes include Session ID, User/Candidate ID, Selected Technologies, Difficulty, System-Assigned Duration, Session Mode (StandardAssessment or SpeedDrillRetry), Parent Session ID (optional for retries), Started At, Expires At, Status (Pending, Active, Submitted, Expired, Evaluated), and Final Score.
- **ExerciseDefinition**: Represents the generated coding challenge. Attributes include Exercise ID, Title, Requirements Description, Technology Tags, Difficulty, Architecture Pattern (SingleIntegratedProject), Has Live Preview (Boolean), System-Assigned Duration, Starter Files Manifest, Public Test Manifest, Private Test Manifest, and Canonical Solution Manifest.
- **TestSuite**: Collection of automated test specifications divided into Public (accessible during practice) and Private (reserved for post-submission evaluation).
- **Submission**: Represents the candidate's final code snapshot submitted for scoring. Attributes include Submission ID, Session ID, Timestamp, Submitted Files, and Submission Trigger (Manual or Auto-Timeout).
- **EvaluationResult**: The assessment outcome. Attributes include Evaluation ID, Submission ID, Numeric Score (0-100), Passed Private Test Count, Total Private Test Count, Detailed Private Test Outputs (test names, pass/fail status, assertion diffs for failures), and Pedagogical AI Feedback Summary (efficiency critique, speed tips, pattern suggestions).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of generated exercises adhere strictly to the selected technology set without containing any unselected technology dependencies.
- **SC-002**: Users receive their newly generated, validated exercise and active workspace in under 15 seconds from confirming configuration.
- **SC-003**: In-browser public test executions return actionable pass/fail feedback to the user within 3 seconds of triggering.
- **SC-004**: Final submission evaluation against private test suites completes and renders the score report within 10 seconds of submission.
- **SC-005**: 0% of private test definitions or canonical solutions leak to candidate workspaces prior to final submission.
- **SC-006**: 100% of submissions attempted after timer expiration are reliably rejected or converted to auto-finalized snapshots taken at the expiry timestamp.
- **SC-007**: For UI challenges, the live preview renders and reflects DOM/style changes within 1 second of code modification without degrading test execution latency.

---

## Assumptions

- The initial release focuses on single-user, standalone technical assessments simulating real interview pressure without candidate-configurable time extensions.
- Code execution is scoped to web standard runtimes (browser DOM, JavaScript/TypeScript runtimes, Node.js runtime, React rendering) suitable for client and backend web technologies.
- Public tests are designed to guide the candidate through the basic contract, while private tests comprehensively verify edge cases, boundary values, and performance characteristics.
- Didactic/interactive database exercises (e.g., relationship matching and schema connection puzzles for SQL) will undergo dedicated research and interface design before active implementation.
- Internet connectivity is required to launch assessments, synchronize code revisions, and receive final evaluation results.
