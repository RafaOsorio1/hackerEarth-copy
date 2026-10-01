# Quickstart & Validation Guide: AI-Powered Technical Assessment Platform

**Feature**: `specs/001-ai-assessment-platform`
**Date**: 2026-10-01
**Status**: Ready for Validation

This guide provides step-by-step verification flows to validate the end-to-end technical assessment workflow against the requirements in [`spec.md`](./spec.md) and interface contracts in [`contracts/assessment-api.json`](./contracts/assessment-api.json).

---

## Prerequisites
- Node.js 20+ installed.
- PostgreSQL database running with Prisma migrations applied.
- `GEMINI_API_KEY` configured in `.env` for AI challenge generation.
- Platform API running at `http://localhost:3001` (or configured dev port).

---

## Validation Scenarios

### Scenario 1: Configure & Start a Timed Assessment
Verify that configuring target technologies initializes an authentic, non-negotiable timed assessment.

1. **Send POST request to initialize an assessment**:
   ```bash
   curl -X POST http://localhost:3001/api/assessments \
     -H "Content-Type: application/json" \
     -d '{
       "technologies": ["React", "TypeScript", "NodeJS"],
       "reactDialect": "TypeScript",
       "difficulty": "Intermediate"
     }'
   ```
2. **Expected Response (HTTP 201)**:
   - Returns JSON containing `sessionId`, `exerciseId`, `title`, `durationMinutes` (strictly between 20 and 60), `startedAt`, `expiresAt`, and `hasLivePreview: true`.
   - `durationMinutes` is predetermined by the AI challenge generator, not the user.
   - Note the `sessionId` for subsequent steps.

---

### Scenario 2: Load Workspace & Run Public Tests
Verify that the candidate workspace receives starter files, public tests, instructions, and that private tests remain 100% hidden.

1. **Fetch workspace manifest**:
   ```bash
   curl http://localhost:3001/api/assessments/$SESSION_ID
   ```
2. **Expected Verification**:
   - Response contains array of `files` with starter boilerplate and public test suites.
   - **Critical Gate**: No private test file paths or contents appear anywhere in the response payload.
   - `remainingSeconds` reflects current server time remaining until `expiresAt`.
3. **Run Public Tests in In-Browser Workspace**:
   - In the frontend UI or WebContainer harness, trigger "Run Tests".
   - Confirm test execution completes in `< 3 seconds` (SC-003) and displays passed/failed test assertions.

---

### Scenario 3: Verify Live Preview Pane (UI Challenges)
Verify that HTML, CSS, and React challenges render an interactive live preview.

1. Open the assessment workspace in the web interface.
2. Confirm the **Live Preview** tab/pane is rendered alongside the Monaco code editor.
3. Edit a component or style (e.g., change a button label or background color).
4. **Expected Outcome**:
   - The preview pane re-renders and displays the updated UI within `< 1 second` (SC-007) without needing manual page reloads or triggering public test execution.

---

### Scenario 4: Auto-Save Snapshot Synchronization
Verify that candidate edits are reliably persisted to protect against network drops or abrupt browser closures.

1. **Send a snapshot update**:
   ```bash
   curl -X PUT http://localhost:3001/api/assessments/$SESSION_ID/snapshot \
     -H "Content-Type: application/json" \
     -d '{
       "files": {
         "src/components/TaskFilter.tsx": "export const TaskFilter = () => <div>Updated Solution</div>;"
       }
     }'
   ```
2. **Expected Response (HTTP 200)**:
   - Returns `{ "savedAt": "...", "remainingSeconds": ... }`.
   - Snapshot is stored in PostgreSQL as `currentCodeSnapshot`.

---

### Scenario 5: Submit Solution & Review Formative Scorecard
Verify that final submissions lock editing, trigger private test evaluation in a secure sandbox, and render comprehensive feedback.

1. **Submit the solution**:
   ```bash
   curl -X POST http://localhost:3001/api/assessments/$SESSION_ID/submit \
     -H "Content-Type: application/json" \
     -d '{
       "trigger": "MANUAL",
       "files": {
         "src/components/TaskFilter.tsx": "export const TaskFilter = () => <div>Complete Solution</div>;"
       }
     }'
   ```
2. **Expected Response (HTTP 202)**:
   - Session transitions to `EVALUATING`.
3. **Fetch Evaluation Results**:
   ```bash
   curl http://localhost:3001/api/assessments/$SESSION_ID/results
   ```
4. **Expected Outcome (HTTP 200)**:
   - Returns within `< 10 seconds` of submission (SC-004).
   - Contains:
     - `numericScore` (0 to 100).
     - Breakdown of passed/failed private tests (`passedPrivateTests`, `totalPrivateTests`).
     - Specific failure causes and assertion errors for any failed test.
     - `aiFeedbackSummary`: actionable markdown critique offering specific code optimizations and speed tips for next time.

---

### Scenario 6: Speed Drill Retry Execution
Verify that candidates can retry the same challenge against the clock to train their speed.

1. **Trigger Speed Drill retry**:
   ```bash
   curl -X POST http://localhost:3001/api/assessments/$SESSION_ID/speed-drill
   ```
2. **Expected Response (HTTP 201)**:
   - Returns a new session object with:
     - `exerciseId` identical to the previous session.
     - `sessionMode: "SPEED_DRILL"`.
     - `startedAt` reset to current timestamp and fresh `expiresAt`.
     - Clean starter files (reverting candidate changes from attempt 1).
3. **Candidate Experience**:
   - The candidate can immediately replay the challenge applying the AI feedback to beat their previous time.
