export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404;
  readonly code = 'RESOURCE_NOT_FOUND';

  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' not found.` : `${resource} not found.`);
    this.name = 'NotFoundError';
  }
}

export class SessionExpiredError extends DomainError {
  readonly statusCode = 403;
  readonly code = 'SESSION_EXPIRED';

  constructor(sessionId: string, message: string = 'Assessment session deadline has elapsed.') {
    super(`Session '${sessionId}' expired: ${message}`);
    this.name = 'SessionExpiredError';
  }
}

export class SubmissionNotAllowedError extends DomainError {
  readonly statusCode = 409;
  readonly code = 'SUBMISSION_NOT_ALLOWED';

  constructor(message: string) {
    super(message);
    this.name = 'SubmissionNotAllowedError';
  }
}

export class AssessmentNotEvaluatedError extends DomainError {
  readonly statusCode = 400;
  readonly code = 'ASSESSMENT_NOT_EVALUATED';

  constructor(sessionId: string) {
    super(`Assessment session '${sessionId}' has not yet been evaluated.`);
    this.name = 'AssessmentNotEvaluatedError';
  }
}

export class ChallengeGenerationError extends DomainError {
  readonly statusCode = 502;
  readonly code = 'CHALLENGE_GENERATION_FAILED';

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`Challenge generation failed: ${message}`);
    this.name = 'ChallengeGenerationError';
  }
}

export class PreValidationError extends DomainError {
  readonly statusCode = 502;
  readonly code = 'PRE_VALIDATION_FAILED';

  constructor(message: string) {
    super(`Pre-validation failed: ${message}`);
    this.name = 'PreValidationError';
  }
}
