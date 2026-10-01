import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { TestOutput } from '../../assessment/schemas/assessment.schema';

const execFileAsync = promisify(execFile);

export interface SandboxRunParams {
  files: Record<string, string>;
  testFiles: Array<{ path: string; content: string }>;
  timeoutMs?: number;
  memoryLimitMb?: number;
}

export interface SandboxRunResult {
  numericScore: number;
  passedPrivateTests: number;
  totalPrivateTests: number;
  testOutputs: TestOutput[];
}

export class SandboxRunnerService {
  async runTests(params: SandboxRunParams): Promise<SandboxRunResult> {
    const timeoutMs = params.timeoutMs ?? 5000;
    const memoryLimitMb = params.memoryLimitMb ?? 256;

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hackerearth-sandbox-'));

    try {
      // 1. Write user submitted files
      for (const [filePath, content] of Object.entries(params.files)) {
        const fullPath = path.join(tempDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf8');
      }

      // 2. Write test files
      const testFilePaths: string[] = [];
      for (const testFile of params.testFiles) {
        const fullPath = path.join(tempDir, testFile.path);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, testFile.content, 'utf8');
        testFilePaths.push(fullPath);
      }

      // 3. Create sandbox runner script with network isolation and assertions
      const runnerScript = `
        const fs = require('fs');
        const path = require('path');
        const net = require('net');
        const http = require('http');
        const https = require('https');

        // Network isolation
        const disableNetwork = () => {
          throw new Error('Network access is disabled in sandbox (--net=none enforced)');
        };
        net.Socket.prototype.connect = disableNetwork;
        http.request = disableNetwork;
        http.get = disableNetwork;
        https.request = disableNetwork;
        https.get = disableNetwork;

        const results = [];
        const testQueue = [];

        global.describe = (name, fn) => fn();
        global.test = (name, fn) => {
          testQueue.push({ name, fn });
        };
        global.it = global.test;

        global.expect = (actual) => ({
          toBe: (expected) => {
            if (actual !== expected) {
              const err = new Error(\`Expected \${JSON.stringify(expected)} but received \${JSON.stringify(actual)}\`);
              err.actual = actual;
              err.expected = expected;
              throw err;
            }
          },
          toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              const err = new Error(\`Expected \${JSON.stringify(expected)} but received \${JSON.stringify(actual)}\`);
              err.actual = actual;
              err.expected = expected;
              throw err;
            }
          },
          toBeTruthy: () => {
            if (!actual) throw new Error(\`Expected truthy but received \${actual}\`);
          },
          toBeFalsy: () => {
            if (actual) throw new Error(\`Expected falsy but received \${actual}\`);
          },
        });

        async function run() {
          const testFiles = ${JSON.stringify(testFilePaths)};
          for (const file of testFiles) {
            try {
              require(file);
            } catch (err) {
              results.push({
                testName: path.basename(file),
                status: 'FAILED',
                errorMessage: err.message || String(err),
                durationMs: 0
              });
            }
          }

          for (const item of testQueue) {
            const start = Date.now();
            try {
              const maybePromise = item.fn();
              if (maybePromise && typeof maybePromise.then === 'function') {
                await maybePromise;
              }
              results.push({
                testName: item.name,
                status: 'PASSED',
                durationMs: Math.max(1, Date.now() - start),
              });
            } catch (err) {
              let diff = undefined;
              if (err.actual !== undefined && err.expected !== undefined) {
                diff = \`- \${JSON.stringify(err.actual)}\\n+ \${JSON.stringify(err.expected)}\`;
              }
              results.push({
                testName: item.name,
                status: 'FAILED',
                errorMessage: err.message || String(err),
                diff,
                durationMs: Math.max(1, Date.now() - start),
              });
            }
          }

          console.log('__EVALUATION_RESULTS_START__' + JSON.stringify(results) + '__EVALUATION_RESULTS_END__');
        }

        run().catch(err => {
          console.error(err);
          process.exit(1);
        });
      `;

      const runnerPath = path.join(tempDir, 'sandbox-entrypoint.js');
      fs.writeFileSync(runnerPath, runnerScript, 'utf8');

      // 4. Execute with memory cap and execution timeout
      const nodeArgs = [`--max-old-space-size=${memoryLimitMb}`, runnerPath];

      let stdout = '';
      let stderr = '';

      try {
        const proc = await execFileAsync(process.execPath, nodeArgs, {
          cwd: tempDir,
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          env: {
            PATH: process.env.PATH,
            NODE_ENV: 'test',
          },
        });
        stdout = proc.stdout;
        stderr = proc.stderr;
      } catch (err: unknown) {
        const error = err as {
          killed?: boolean;
          signal?: string;
          code?: number;
          message?: string;
          stdout?: string;
          stderr?: string;
        };

        const out = error.stdout || '';
        const errOut = error.stderr || '';

        // Check if results were already emitted
        const markerStart = out.indexOf('__EVALUATION_RESULTS_START__');
        const markerEnd = out.indexOf('__EVALUATION_RESULTS_END__');
        if (markerStart !== -1 && markerEnd !== -1) {
          const jsonStr = out.substring(
            markerStart + '__EVALUATION_RESULTS_START__'.length,
            markerEnd,
          );
          const parsed = JSON.parse(jsonStr) as TestOutput[];
          return this.aggregateResults(parsed);
        }

        // Handle timeout
        if (
          error.killed ||
          error.signal === 'SIGTERM' ||
          (error.message && error.message.includes('timed out'))
        ) {
          const testOutputs: TestOutput[] = params.testFiles.map((tf) => ({
            testName: path.basename(tf.path),
            status: 'FAILED',
            errorMessage: `Execution timed out (${timeoutMs / 1000}s limit exceeded)`,
            durationMs: timeoutMs,
          }));
          return this.aggregateResults(testOutputs);
        }

        // Handle OOM
        if (
          errOut.includes('JavaScript heap out of memory') ||
          errOut.includes('allocation failure') ||
          (error.message && error.message.includes('heap'))
        ) {
          const testOutputs: TestOutput[] = params.testFiles.map((tf) => ({
            testName: path.basename(tf.path),
            status: 'FAILED',
            errorMessage: `Memory limit exceeded (${memoryLimitMb}MB cap): JavaScript heap out of memory`,
            durationMs: 0,
          }));
          return this.aggregateResults(testOutputs);
        }

        // Other generic execution error
        const testOutputs: TestOutput[] = params.testFiles.map((tf) => ({
          testName: path.basename(tf.path),
          status: 'FAILED',
          errorMessage: errOut || error.message || 'Execution failed',
          durationMs: 0,
        }));
        return this.aggregateResults(testOutputs);
      }

      // Parse successful output
      const markerStart = stdout.indexOf('__EVALUATION_RESULTS_START__');
      const markerEnd = stdout.indexOf('__EVALUATION_RESULTS_END__');

      if (markerStart === -1 || markerEnd === -1) {
        const testOutputs: TestOutput[] = params.testFiles.map((tf) => ({
          testName: path.basename(tf.path),
          status: 'FAILED',
          errorMessage: stderr || 'No test results produced',
          durationMs: 0,
        }));
        return this.aggregateResults(testOutputs);
      }

      const jsonStr = stdout.substring(
        markerStart + '__EVALUATION_RESULTS_START__'.length,
        markerEnd,
      );
      const testOutputs = JSON.parse(jsonStr) as TestOutput[];
      return this.aggregateResults(testOutputs);
    } finally {
      // 5. Cleanup temporary sandbox files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup failure
      }
    }
  }

  private aggregateResults(testOutputs: TestOutput[]): SandboxRunResult {
    const totalPrivateTests = testOutputs.length;
    const passedPrivateTests = testOutputs.filter((t) => t.status === 'PASSED').length;
    const numericScore =
      totalPrivateTests > 0
        ? Math.round((passedPrivateTests / totalPrivateTests) * 100 * 10) / 10
        : 0;

    return {
      numericScore,
      passedPrivateTests,
      totalPrivateTests,
      testOutputs,
    };
  }
}
