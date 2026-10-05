import { GenerateChallengeParams, FeedbackGenerationParams } from '../types';

export function buildChallengePrompt(params: GenerateChallengeParams): string {
  const techList = params.technologies.join(', ');
  const hasFrontend = params.technologies.some((t) => ['HTML', 'CSS', 'React'].includes(t));
  const hasHTML = params.technologies.includes('HTML');
  const hasCSS = params.technologies.includes('CSS');
  const hasJS = params.technologies.includes('JavaScript');
  const hasTS = params.technologies.includes('TypeScript');
  const hasReact = params.technologies.includes('React');
  const hasNode = params.technologies.includes('NodeJS');
  const htmlCssOnly = (hasHTML || hasCSS) && !hasJS && !hasTS && !hasReact && !hasNode;

  const dialectNote =
    params.technologies.includes('React') && params.reactDialect
      ? ` (React Dialect: strictly ${params.reactDialect} using ${params.reactDialect === 'TypeScript' ? '.tsx/.ts' : '.jsx/.js'} files)`
      : '';

  const htmlOnlyConstraint = htmlCssOnly
    ? `\n   - CRITICAL HTML/CSS-ONLY CONSTRAINT: JavaScript is NOT selected. Candidate implementation files (in starterFiles and canonicalSolution) MUST NOT contain any .js, .ts, .jsx, or .tsx files, and index.html MUST NOT contain any inline or external <script> tags. Starter files and canonical solutions must strictly be .html and/or .css files.`
    : '';

  const starterFilesExample = htmlCssOnly
    ? `[
    { "path": "index.html", "content": "<!DOCTYPE html>\\n<html>\\n<head>\\n  <link rel=\\"stylesheet\\" href=\\"styles.css\\">\\n</head>\\n<body>\\n  <!-- TODO: Candidate HTML -->\\n</body>\\n</html>", "readOnly": false },
    { "path": "styles.css", "content": "/* TODO: Candidate styling */", "readOnly": false },
    { "path": "package.json", "content": "{}", "readOnly": true }
  ]`
    : `[
    { "path": "src/index.js", "content": "/* starter code with TODO */", "readOnly": false },
    { "path": "package.json", "content": "{}", "readOnly": true }
  ]`;

  const canonicalExample = htmlCssOnly
    ? `[
    { "path": "index.html", "content": "<!DOCTYPE html>\\n<html><head><link rel=\\"stylesheet\\" href=\\"styles.css\\"></head><body><h1>Complete</h1></body></html>" },
    { "path": "styles.css", "content": "/* complete styling */" }
  ]`
    : `[
    { "path": "src/index.js", "content": "/* complete working implementation */" }
  ]`;

  return `You are an expert technical assessment designer creating authentic coding challenges under interview pressure.
Create a self-contained, realistic technical coding challenge for a candidate.

STRICT CONSTRAINTS:
1. Target Technologies: ${techList}${dialectNote}. (Do NOT include any external or unselected technology frameworks or libraries).
2. Difficulty Level: ${params.difficulty}.
3. Duration Budget: Calculate an accurate time budget strictly between 20 and 60 minutes based on difficulty and realistic completion speed.
4. Architecture Pattern: Single integrated project. If multiple technologies are selected (e.g. React + NodeJS), create an integrated mini-application where the client talks to the server or shares logic.
5. Starter Files:
   - Provide minimal, clean starter files with explicit TODO comments indicating where the candidate should write code.
   - For configuration files (e.g., package.json, tsconfig.json), set "readOnly": true.
   - For candidate implementation files (e.g., src/index.ts, src/App.tsx, index.html), set "readOnly": false.${htmlOnlyConstraint}
6. Public Tests:
   - Provide at least 1-2 public test suites using Vitest or Jest.
   - Tests must verify happy-path contracts and give actionable failure feedback.
   - For HTML/CSS-only challenges, tests must assert semantic DOM markup, structure, or CSS rules (e.g. inspecting index.html / styles.css).
7. Private Tests:
   - Provide at least 1-2 hidden test suites verifying edge cases, boundary conditions, malformed input, and performance.
8. Canonical Solution:
   - Provide the complete, working code for all implementation files that passes 100% of both public and private tests without warnings or type errors.
${hasFrontend ? '9. Live Preview: The challenge involves visual rendering. Ensure starterFiles include an entry point (e.g., index.html or App.tsx) suitable for in-browser rendering.' : ''}

CRITICAL: You MUST return ONLY a valid JSON object matching this EXACT structure with camelCase keys:
{
  "title": "Concise challenge title string",
  "description": "Comprehensive markdown instructions and requirements",
  "technologies": ${JSON.stringify(params.technologies)},
  "difficulty": "${params.difficulty}",
  "estimatedDurationMinutes": 30,
  "starterFiles": ${starterFilesExample},
  "publicTests": [
    { "path": "tests/public/main.test.js", "content": "test('basic requirement', () => { ... });" }
  ],
  "privateTests": [
    { "path": "tests/private/edge1.test.js", "content": "test('edge case 1', () => { ... });" },
    { "path": "tests/private/edge2.test.js", "content": "test('edge case 2', () => { ... });" }
  ],
  "canonicalSolution": ${canonicalExample}
}

Do not include markdown code fence formatting (such as \`\`\`json) outside the JSON output.`;
}

export function buildFeedbackPrompt(params: FeedbackGenerationParams): string {
  return `You are a supportive, high-caliber technical interviewer giving pedagogical and speed optimization feedback.
Challenge: "${params.challengeTitle}"
Technologies: ${params.technologies.join(', ')}
Time Allowed: ${params.durationMinutes} minutes
Time Taken: ${params.timeSpentMinutes} minutes
Private Test Score: ${params.testResults.passed}/${params.testResults.total} passed

Failed Tests:
${JSON.stringify(params.testResults.failures, null, 2)}

Candidate Submitted Code:
${JSON.stringify(params.submittedCode, null, 2)}

Provide structured, constructive feedback in markdown with:
1. **Performance Summary**: Clear assessment of speed, code quality, and test outcomes.
2. **Speed & Agility Tips**: Specific shortcuts, idiomatic patterns, or architectural choices that would have saved 5-10 minutes under interview pressure.
3. **Edge Cases & Missed Requirements**: Analysis of why the failing tests failed and how to address them cleanly.
4. **Key Takeaways**: 2-3 actionable lessons for future technical assessments.`;
}
