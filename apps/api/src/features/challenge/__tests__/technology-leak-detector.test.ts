import { describe, it, expect } from 'vitest';
import { TechnologyLeakDetector } from '../services/technology-leak-detector.service';
import { SupportedTechnology } from '@hackerearth/ai';

describe('TechnologyLeakDetector Unit Tests (T048)', () => {
  const detector = new TechnologyLeakDetector();

  it('should pass cleanly when files strictly match selected technologies (HTML + CSS)', () => {
    const selected: SupportedTechnology[] = ['HTML', 'CSS'];
    const files = [
      {
        path: 'index.html',
        content:
          '<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Hello</h1></body></html>',
      },
      { path: 'style.css', content: 'body { color: red; }' },
    ];

    const result = detector.detectLeaks(selected, undefined, files);
    expect(result.hasLeak).toBe(false);
    expect(result.violations).toHaveLength(0);
  });

  it('should flag leak when JavaScript/TypeScript is found in an HTML+CSS only challenge', () => {
    const selected: SupportedTechnology[] = ['HTML', 'CSS'];
    const files = [
      { path: 'index.html', content: '<html><body><script src="app.js"></script></body></html>' },
      { path: 'app.js', content: 'console.log("unselected tech!");' },
      { path: 'style.css', content: 'body { color: blue; }' },
    ];

    const result = detector.detectLeaks(selected, undefined, files);
    expect(result.hasLeak).toBe(true);
    expect(result.violations.some((v) => v.includes('JavaScript') || v.includes('.js'))).toBe(true);
  });

  it('should flag leak when React or Node.js packages appear in a pure JavaScript challenge', () => {
    const selected: SupportedTechnology[] = ['JavaScript'];
    const files = [
      {
        path: 'src/index.js',
        content: 'import React from "react"; export default function App() {}',
      },
      { path: 'package.json', content: JSON.stringify({ dependencies: { react: '^18.0.0' } }) },
    ];

    const result = detector.detectLeaks(selected, undefined, files);
    expect(result.hasLeak).toBe(true);
    expect(result.violations.some((v) => v.toLowerCase().includes('react'))).toBe(true);
  });

  it('should flag TypeScript files or syntax when React dialect is set to JavaScript', () => {
    const selected: SupportedTechnology[] = ['React'];
    const files = [
      {
        path: 'src/App.tsx',
        content: 'interface Props { name: string; } export default function App(props: Props) {}',
      },
    ];

    const result = detector.detectLeaks(selected, 'JavaScript', files);
    expect(result.hasLeak).toBe(true);
    expect(result.violations.some((v) => v.includes('TypeScript') || v.includes('.tsx'))).toBe(
      true,
    );
  });

  it('should allow valid React TypeScript files when dialect is TypeScript', () => {
    const selected: SupportedTechnology[] = ['React', 'TypeScript'];
    const files = [
      {
        path: 'src/App.tsx',
        content: 'export default function App(): JSX.Element { return <div>App</div>; }',
      },
      { path: 'src/types.ts', content: 'export interface User { id: string; }' },
      {
        path: 'package.json',
        content: JSON.stringify({
          dependencies: { react: '^18.0.0' },
          devDependencies: { typescript: '^5.0.0' },
        }),
      },
    ];

    const result = detector.detectLeaks(selected, 'TypeScript', files);
    expect(result.hasLeak).toBe(false);
    expect(result.violations).toHaveLength(0);
  });

  it('should allow automated runner test files (.test.js) in HTML-only challenges while rejecting candidate script files', () => {
    const selected: SupportedTechnology[] = ['HTML'];
    const validFilesWithTestSuites = [
      {
        path: 'index.html',
        content: '<!DOCTYPE html><html><body><h1>Accessible Title</h1></body></html>',
      },
      { path: 'styles.css', content: 'h1 { font-size: 2rem; }' },
      {
        path: 'tests/public/structure.test.js',
        content: 'test("has h1", () => { expect(document.querySelector("h1")).toBeTruthy(); });',
      },
      {
        path: 'tests/private/accessibility.test.js',
        content: 'test("a11y rules", () => { expect(true).toBe(true); });',
      },
    ];

    const cleanResult = detector.detectLeaks(selected, undefined, validFilesWithTestSuites);
    expect(cleanResult.hasLeak).toBe(false);
    expect(cleanResult.violations).toHaveLength(0);

    const candidateWithScript = [
      ...validFilesWithTestSuites,
      { path: 'script.js', content: 'console.log("unwanted candidate script");' },
    ];
    const leakResult = detector.detectLeaks(selected, undefined, candidateWithScript);
    expect(leakResult.hasLeak).toBe(true);
    expect(leakResult.violations.some((v) => v.includes('script.js'))).toBe(true);
  });
});
