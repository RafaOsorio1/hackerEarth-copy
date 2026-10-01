import { describe, it, expect } from 'vitest';
import { SandboxRunnerService } from '../services/sandbox-runner.service';

describe('SandboxRunnerService Unit Tests (T038)', () => {
  const runner = new SandboxRunnerService();

  it('should run valid tests and return passed status for successful assertions', async () => {
    const result = await runner.runTests({
      files: {
        'src/math.js': 'module.exports = { add: (a, b) => a + b };',
      },
      testFiles: [
        {
          path: 'tests/private/math.test.js',
          content: `
            const { add } = require('../../src/math.js');
            test('adds numbers correctly', () => {
              if (add(2, 3) !== 5) throw new Error('Expected 2 + 3 to equal 5');
            });
          `,
        },
      ],
    });

    expect(result.passedPrivateTests).toBe(1);
    expect(result.totalPrivateTests).toBe(1);
    expect(result.numericScore).toBe(100);
    const firstOutput = result.testOutputs[0];
    expect(firstOutput).toBeDefined();
    expect(firstOutput?.status).toBe('PASSED');
    expect(firstOutput?.testName).toBe('adds numbers correctly');
  });

  it('should capture failure error message and diff when assertion fails', async () => {
    const result = await runner.runTests({
      files: {
        'src/math.js': 'module.exports = { add: (a, b) => a - b };',
      },
      testFiles: [
        {
          path: 'tests/private/math.test.js',
          content: `
            const { add } = require('../../src/math.js');
            test('adds numbers correctly', () => {
              const res = add(2, 3);
              if (res !== 5) {
                const err = new Error('AssertionError: expected -1 to equal 5');
                err.actual = res;
                err.expected = 5;
                throw err;
              }
            });
          `,
        },
      ],
    });

    expect(result.passedPrivateTests).toBe(0);
    expect(result.totalPrivateTests).toBe(1);
    expect(result.numericScore).toBe(0);
    const firstOutput = result.testOutputs[0];
    expect(firstOutput).toBeDefined();
    expect(firstOutput?.status).toBe('FAILED');
    expect(firstOutput?.errorMessage).toContain('AssertionError: expected -1 to equal 5');
    expect(firstOutput?.diff).toBeDefined();
  });

  it('should enforce execution timeout (5s default) and fail gracefully on infinite loops', async () => {
    const result = await runner.runTests({
      files: {
        'src/loop.js': 'module.exports = { loop: () => { while(true) {} } };',
      },
      testFiles: [
        {
          path: 'tests/private/loop.test.js',
          content: `
            const { loop } = require('../../src/loop.js');
            test('handles infinite loop', () => {
              loop();
            });
          `,
        },
      ],
      timeoutMs: 1000, // Short timeout for test speed
    });

    expect(result.passedPrivateTests).toBe(0);
    expect(result.totalPrivateTests).toBe(1);
    const firstOutput = result.testOutputs[0];
    expect(firstOutput).toBeDefined();
    expect(firstOutput?.status).toBe('FAILED');
    expect(firstOutput?.errorMessage).toMatch(/timed out|timeout/i);
  });

  it('should enforce memory limit cap (256MB) and prevent heap crashes', async () => {
    const result = await runner.runTests({
      files: {
        'src/leak.js': `
          module.exports = {
            leak: () => {
              const arr = [];
              for (let i = 0; i < 100000000; i++) {
                arr.push(new Array(10000).fill('leak'));
              }
            }
          };
        `,
      },
      testFiles: [
        {
          path: 'tests/private/leak.test.js',
          content: `
            const { leak } = require('../../src/leak.js');
            test('exceeds memory cap', () => {
              leak();
            });
          `,
        },
      ],
      timeoutMs: 3000,
      memoryLimitMb: 64, // Reduced memory limit for test speed
    });

    expect(result.passedPrivateTests).toBe(0);
    const firstOutput = result.testOutputs[0];
    expect(firstOutput).toBeDefined();
    expect(firstOutput?.status).toBe('FAILED');
    expect(firstOutput?.errorMessage).toMatch(/memory|heap|allocation/i);
  });

  it('should isolate network access preventing outbound requests', async () => {
    const result = await runner.runTests({
      files: {
        'src/net.js': `
          module.exports = {
            fetchData: async () => {
              const http = require('http');
              return new Promise((resolve, reject) => {
                http.get('http://example.com', resolve).on('error', reject);
              });
            }
          };
        `,
      },
      testFiles: [
        {
          path: 'tests/private/net.test.js',
          content: `
            const { fetchData } = require('../../src/net.js');
            test('network access is restricted', async () => {
              await fetchData();
            });
          `,
        },
      ],
      timeoutMs: 2000,
    });

    expect(result.passedPrivateTests).toBe(0);
    const firstOutput = result.testOutputs[0];
    expect(firstOutput).toBeDefined();
    expect(firstOutput?.status).toBe('FAILED');
  });
});
