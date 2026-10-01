export class ModelProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ModelProviderError';
  }
}
