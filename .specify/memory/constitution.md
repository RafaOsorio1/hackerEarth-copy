<!--
Sync Impact Report
- Version change: Initial draft -> 1.0.0
- List of principles defined:
  1. Type Safety First
  2. Clean and Consistent Project Structure
  3. Layered Architecture
  4. Feature-Based Routing
  5. Separation of Responsibilities
  6. Clean Code and Readability
  7. Error Handling
  8. Automated Testing
  9. Dependency Management
  10. Explicit API Design
  11. Maintainability and Evolutionary Design
  12. Definition of Done
  13. Language and Communication
- Added sections: Core Principles (I-XIII), Governance
- Removed sections: Unconfigured template placeholders
- Follow-up TODOs: None
-->

# HackerEarth-Copy Constitution

## Core Principles

### I. Type Safety First
- TypeScript MUST be used throughout the entire application.
- The `any` type is strictly forbidden. Developers MUST use explicit types, interfaces, generics, unions, or `unknown` with proper type narrowing when handling undetermined types.
- Unsafe type assertions (`as Type`) MUST NOT be used to bypass the type checker.
- Public functions, APIs, services, use cases, and data-access methods MUST define explicit and meaningful parameter and return types.
- External input (such as HTTP request payloads, route params, query strings, and environment variables) MUST be validated at runtime before processing.

### II. Clean and Consistent Project Structure
- Code MUST be organized by feature/domain rather than by technical layer alone.
- Each feature module MUST encapsulate its own routes, controllers, use cases/services, validation schemas, domain types, and tests where appropriate.
- Related code MUST be kept close together; single features MUST NOT be scattered across unrelated directories.
- Directory and file layouts MUST remain predictable, easy to navigate, and consistent across all features.

### III. Layered Architecture
- HTTP routes MUST be responsible solely for defining and composing HTTP endpoints.
- Controllers MUST be responsible only for the HTTP transport layer: validating incoming requests, invoking the appropriate use case, and translating domain results or errors into HTTP responses.
- Use cases and domain services MUST contain all application and business logic. Business logic MUST NOT reside inside controllers or route handlers.
- Data access MUST be isolated behind repositories or dedicated data-access modules.
- Controllers MUST NOT interact directly with the database or ORM client.
- Routes MUST NOT contain business logic or database operations.
- Dependencies MUST flow inward toward business logic; business logic MUST NOT depend directly on HTTP transport concerns or web framework constructs.

### IV. Feature-Based Routing
- Routes MUST be organized strictly by feature.
- Each feature MUST expose its routes through a local route entry point (e.g., `routes/index.ts`).
- The top-level application router MUST compose individual feature routers from these entry points.
- Endpoints MUST follow clear, resource-oriented RESTful paths (e.g., `/auth/login`, `/auth/register`, `/users/:id`).
- All application routes MUST NOT be bundled into a monolithic global route file.

### V. Separation of Responsibilities
- Each module, class, or function MUST have a single, well-defined responsibility.
- Controllers MUST remain thin orchestrators.
- Use cases and domain services MUST contain the actual business workflow and behavior.
- Input validation MUST remain separate from business logic.
- Database queries, SQL, and ORM-specific details MUST remain isolated from business logic.
- Unnecessary coupling between layers MUST be prevented.

### VI. Clean Code and Readability
- Code MUST prioritize readability, clarity, and maintainability over cleverness or speculative abstraction.
- Simple, explicit solutions MUST be preferred over premature abstractions.
- Descriptive and intention-revealing names MUST be used for variables, functions, classes, types, and modules.
- Functions and modules MUST remain focused, cohesive, and reasonably concise.
- Deeply nested conditionals and convoluted control flow MUST be avoided; prefer early returns and guard clauses.
- Logic MUST NOT be duplicated when a clean, reusable abstraction provides genuine value, but abstractions MUST NOT be introduced solely to adhere to arbitrary patterns without solving an actual problem.
- Code MUST be readily understandable by any team member without relying on private assumptions or implicit knowledge of the original author.

### VII. Error Handling
- Errors MUST be handled explicitly and consistently; errors MUST NOT be silently swallowed.
- Domain and application errors MUST be strongly typed and descriptive.
- HTTP-specific error translation and status codes MUST remain strictly within the HTTP layer.
- Business and domain logic MUST NOT depend directly on HTTP response objects (`res`), status codes, or framework-specific HTTP exceptions.

### VIII. Automated Testing
- Every feature MUST include automated tests.
- Business rules, domain models, and use cases MUST be covered by unit tests.
- Controllers and HTTP endpoints MUST have integration or API tests validating the contract.
- Critical business workflows MUST have regression coverage.
- Tests MUST verify observable behavior rather than internal implementation details.
- No feature or functionality is considered complete until all relevant automated tests are implemented and passing.
- Tests MUST be colocated with their corresponding feature or follow a project-wide standard testing convention.

### IX. Dependency Management
- Dependencies MUST be explicit and injected wherever practical to ensure loose coupling.
- Business logic MUST NOT instantiate concrete infrastructure dependencies directly when doing so impairs testability or modular replacement.
- Infrastructure concerns (databases, HTTP engines, external APIs, queues, caching services) MUST remain replaceable without requiring rewrites of core domain logic.

### X. Explicit API Design
- API contracts MUST be explicit, deterministic, and consistently typed.
- Request payloads, query parameters, route parameters, and responses MUST be typed and validated with schemas.
- API responses and error envelopes MUST adhere to uniform conventions across all endpoints.
- HTTP-specific transport concerns MUST remain confined to the architectural boundary.

### XI. Maintainability and Evolutionary Design
- Every implementation MUST be designed considering how another engineer will read, test, modify, and extend the code.
- Consistency with existing codebase conventions MUST take precedence over introducing unvetted patterns.
- Any introduction of a new architectural pattern requires documented justification.
- Speculative features, unused abstractions, and premature optimizations MUST be rejected.
- Code complexity MUST be kept low enough that the architecture remains an enabler rather than an operational burden.

### XII. Definition of Done
A feature MUST NOT be considered complete merely because code runs locally.
A feature is considered complete ONLY when:
1. The architectural design strictly adheres to this Constitution.
2. The implementation is 100% type-safe without `any` or unsafe assertions.
3. Runtime validation is enforced at all public boundaries.
4. Business logic is fully isolated from HTTP transport and infrastructure details.
5. Automated unit and integration tests are written and passing.
6. Error handling follows typed and uniform project conventions.
7. Code is clean, readable, self-documenting, and maintainable.
8. No speculative abstractions or unaddressed technical debt have been introduced.

### XIII. Language and Communication
- All source code, variable names, function names, class names, file names, comments, documentation, commit messages, and project artifacts MUST be written in English.
- All generated technical documentation MUST be written in English.
- Communication with the developer MAY be conducted in Spanish.
- When asking questions, requesting clarification, or explaining architectural decisions to the developer, Spanish MUST be used unless the developer explicitly requests English.
- Developer-facing communication MUST NOT be translated into English unless explicitly requested.

## Governance

This Constitution acts as the supreme technical authority for the HackerEarth-Copy project. All contributors, agents, and reviewers must uphold these rules without exception.

### Amendment Procedure
1. Any proposed modification or principle addition must be documented with an architectural justification.
2. Changes to existing principles require explicit review and approval by the project lead.
3. Any breaking change to established governance rules mandates a migration plan for affected modules.

### Versioning Policy
This document adheres to semantic versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR**: Incompatible governance modifications, removals, or fundamental redefinitions of core principles.
- **MINOR**: Addition of new principles, architectural sections, or materially expanded governance rules.
- **PATCH**: Clarifications, formatting fixes, non-semantic wording improvements.

### Compliance and Quality Gates
- Every Pull Request and automated review MUST verify strict adherence to the Definition of Done (Principle XII).
- Deviations or temporary exceptions must be documented in a dedicated ADR (Architecture Decision Record) approved by the team.

**Version**: 1.0.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
