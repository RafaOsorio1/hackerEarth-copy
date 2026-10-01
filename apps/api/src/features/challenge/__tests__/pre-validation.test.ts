import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreValidationService } from '../services/pre-validation.service';
import { TechnologyLeakDetector } from '../services/technology-leak-detector.service';
import { SandboxRunnerService } from '../../evaluation/services/sandbox-runner.service';
import { GeneratedChallenge } from '@hackerearth/ai';

describe('PreValidationService Unit Tests (T049)', () => {
  const mockLeakDetector = {
    detectLeaks: vi.fn(),
  } as unknown as TechnologyLeakDetector;

  const mockSandboxRunner = {
    runTests: vi.fn(),
  } as unknown as SandboxRunnerService;

  const preValidationService = new PreValidationService(mockLeakDetector, mockSandboxRunner);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validChallenge: GeneratedChallenge = {
    title: 'Valid Assessment',
    description: 'Build a calculator function',
    technologies: ['JavaScript'],
    difficulty: 'Intermediate',
    estimatedDurationMinutes: 30,
    starterFiles: [
      {
        path: 'src/calc.js',
        content: 'function calc() {} module.exports = { calc };',
        readOnly: false,
      },
      { path: 'package.json', content: '{}', readOnly: true },
    ],
    publicTests: [{ path: 'tests/public/calc.test.js', content: 'test("calc", () => {})' }],
    privateTests: [
      { path: 'tests/private/edge.test.js', content: 'test("edge", () => {})' },
      { path: 'tests/private/perf.test.js', content: 'test("perf", () => {})' },
    ],
    canonicalSolution: [
      { path: 'src/calc.js', content: 'function calc() { return 42; } module.exports = { calc };' },
    ],
  };

  it('should validate cleanly when zero leaks are detected and canonical solution passes 100% of tests', async () => {
    vi.mocked(mockLeakDetector.detectLeaks).mockReturnValue({
      hasLeak: false,
      violations: [],
    });

    vi.mocked(mockSandboxRunner.runTests).mockResolvedValue({
      numericScore: 100,
      passedPrivateTests: 2,
      totalPrivateTests: 2,
      testOutputs: [
        { testName: 'edge', status: 'PASSED', durationMs: 10 },
        { testName: 'perf', status: 'PASSED', durationMs: 15 },
      ],
    });

    const result = await preValidationService.validate(validChallenge, {
      technologies: ['JavaScript'],
      difficulty: 'Intermediate',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when TechnologyLeakDetector finds violations', async () => {
    vi.mocked(mockLeakDetector.detectLeaks).mockReturnValue({
      hasLeak: true,
      violations: ['Unselected technology React found in src/calc.js'],
    });

    const result = await preValidationService.validate(validChallenge, {
      technologies: ['JavaScript'],
      difficulty: 'Intermediate',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Unselected technology React found in src/calc.js');
    expect(mockSandboxRunner.runTests).not.toHaveBeenCalled();
  });

  it('should fail validation when canonical solution fails any test assertions', async () => {
    vi.mocked(mockLeakDetector.detectLeaks).mockReturnValue({
      hasLeak: false,
      violations: [],
    });

    vi.mocked(mockSandboxRunner.runTests).mockResolvedValue({
      numericScore: 50,
      passedPrivateTests: 1,
      totalPrivateTests: 2,
      testOutputs: [
        { testName: 'edge', status: 'PASSED', durationMs: 10 },
        {
          testName: 'perf',
          status: 'FAILED',
          errorMessage: 'Expected 42 to equal 100',
          durationMs: 15,
        },
      ],
    });

    const result = await preValidationService.validate(validChallenge, {
      technologies: ['JavaScript'],
      difficulty: 'Intermediate',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Canonical solution failed'))).toBe(true);
  });
});
