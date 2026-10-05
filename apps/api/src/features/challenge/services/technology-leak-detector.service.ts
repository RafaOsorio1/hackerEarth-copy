import { SupportedTechnology } from '@hackerearth/ai';

export interface LeakDetectionResult {
  hasLeak: boolean;
  violations: string[];
}

export class TechnologyLeakDetector {
  detectLeaks(
    selectedTechnologies: SupportedTechnology[],
    reactDialect: 'JavaScript' | 'TypeScript' | undefined,
    files: Array<{ path: string; content: string }>,
  ): LeakDetectionResult {
    const violations: string[] = [];
    const techSet = new Set<SupportedTechnology>(selectedTechnologies);

    const hasHTML = techSet.has('HTML');
    const hasCSS = techSet.has('CSS');
    const hasJS = techSet.has('JavaScript');
    const hasTS = techSet.has('TypeScript');
    const hasReact = techSet.has('React');
    const hasNode = techSet.has('NodeJS');

    const htmlCssOnly = (hasHTML || hasCSS) && !hasJS && !hasTS && !hasReact && !hasNode;

    for (const file of files) {
      const lowerPath = file.path.toLowerCase();
      const content = file.content;
      const isTestFile =
        lowerPath.startsWith('tests/') ||
        lowerPath.includes('.test.') ||
        lowerPath.includes('.spec.');

      // 1. HTML+CSS only: Reject any script or JS/TS file in candidate implementation files
      if (htmlCssOnly && !isTestFile) {
        if (
          lowerPath.endsWith('.js') ||
          lowerPath.endsWith('.ts') ||
          lowerPath.endsWith('.jsx') ||
          lowerPath.endsWith('.tsx')
        ) {
          violations.push(
            `JavaScript/TypeScript file ${file.path} found in an HTML+CSS only challenge.`,
          );
        }
        if (lowerPath.endsWith('.html') && /<script\b[^>]*>/i.test(content)) {
          violations.push(
            `Inline or external <script> tag found in ${file.path} for HTML+CSS only challenge.`,
          );
        }
      }

      // 2. Pure JavaScript without React: Flag React imports or JSX files
      if (!hasReact) {
        if (lowerPath.endsWith('.jsx') || lowerPath.endsWith('.tsx')) {
          violations.push(`React JSX/TSX file ${file.path} found when React is not selected.`);
        }
        if (
          /from\s+['"]react['"]/i.test(content) ||
          /require\s*\(\s*['"]react['"]\s*\)/i.test(content) ||
          /import\s+React/i.test(content)
        ) {
          violations.push(`React import found in ${file.path} when React is not selected.`);
        }
      }

      // 3. React Dialect Check: If React dialect is JavaScript, flag TypeScript files/syntax
      if (hasReact && reactDialect === 'JavaScript') {
        if (lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx')) {
          violations.push(
            `TypeScript file ${file.path} found when React dialect is set to JavaScript.`,
          );
        }
        if (/\binterface\s+[A-Z]/g.test(content) || /\btype\s+[A-Z]\w*\s*=/g.test(content)) {
          violations.push(
            `TypeScript type/interface syntax found in ${file.path} when dialect is JavaScript.`,
          );
        }
      }

      // 4. Pure JavaScript without TypeScript: Flag TS files
      if (!hasTS && (!hasReact || reactDialect !== 'TypeScript')) {
        if (lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx')) {
          violations.push(`TypeScript file ${file.path} found when TypeScript was not selected.`);
        }
      }

      // 5. Inspect package.json dependencies against tech selection
      if (lowerPath.endsWith('package.json')) {
        try {
          const pkg = JSON.parse(content) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
          };
          const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
          };

          if (!hasReact && (allDeps['react'] || allDeps['react-dom'])) {
            violations.push(`React dependency found in package.json when React was not selected.`);
          }
          if (!hasTS && allDeps['typescript']) {
            violations.push(
              `TypeScript dependency found in package.json when TypeScript was not selected.`,
            );
          }
        } catch {
          // Ignore parse errors on mock package.json
        }
      }
    }

    return {
      hasLeak: violations.length > 0,
      violations,
    };
  }
}
