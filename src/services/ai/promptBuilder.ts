import type { ReviewRequest } from '../../shared/types';

const JSON_SCHEMA = `{
  "qualityScore": 0,
  "overallSummary": "string",
  "files": [
    {
      "path": "relative/file/path",
      "qualityScore": 0,
      "summary": "string",
      "findings": [
        {
          "severity": "critical|warning|suggestion|info",
          "title": "string",
          "detail": "string",
          "line": 0
        }
      ]
    }
  ]
}`;

const LANGUAGE_RULES: Record<ReviewRequest['language'], string> = {
  en: 'Write ALL human-readable text (overallSummary, file summaries, finding titles and details) in English.',
  pt: 'Escreva TODO o texto legível (overallSummary, resumos dos arquivos, títulos e detalhes dos achados) em português brasileiro.',
};

export function buildReviewPrompt(request: ReviewRequest): string {
  const fileBlocks = request.files
    .map(
      (file) =>
        `### ${file.path} (${file.status})\n\`\`\`diff\n${truncateDiff(file.diff)}\n\`\`\``,
    )
    .join('\n\n');

  return `You are a Principal Software Engineer performing an ultra-conservative, high-signal code review on a git diff.

CORE PHILOSOPHY: ZERO FALSE POSITIVES
- Better to report 0 findings on good code than to report even a single nitpick or questionable suggestion.
- Assume the developer is an expert who wrote the code intentionally to meet business requirements.
- When in doubt, DO NOT FLAG. If an issue is not a 100% verifiable bug or security vulnerability, KEEP FINDINGS EMPTY.

WHAT QUALIFIES AS A FINDING (ONLY THESE):
1. Definite functional bugs (logic inverted, incorrect arithmetic, wrong boolean conditions).
2. Critical security vulnerabilities (SQLi, XSS, exposed raw secrets/keys, authentication bypass).
3. Memory/resource leaks or fatal unhandled promise rejections that crash the app.
4. Broken API contracts (removing or renaming an exported function without updating callers).

STRICTLY FORBIDDEN FROM FINDINGS (NEVER REPORT THESE):
- Redundant runtime validation or defensive checks on TypeScript typed variables, props, or hook arguments (TypeScript handles type safety at compile time).
- Comments, deleted comments, dead code cleanup, or documentation formatting.
- Purely stylistic suggestions (e.g., arrow vs standard functions, loop vs map, early returns).
- Suggestions to add try/catch blocks where errors are meant to bubble up.
- Subjective suggestions about re-renders, useMemo/useCallback, or dependency arrays unless an infinite loop is proven.
- Positive remarks, praises, or descriptions of what changed (put these ONLY in "summary" or "overallSummary").
- Speculation about context or requirements outside the diff.

SEVERITY LEVELS:
- critical: Severe bugs that crash production, leak secrets, or corrupt data.
- warning: Unhandled promise rejections, memory leaks, or confirmed logic flaws.
- suggestion: High-impact, unambiguous performance or correctness improvements only.
- info: Critical operational/migration notices only. NEVER use for opinions or comments.

SCORING (qualityScore):
- 95-100: Clean, safe code with no verifiable bugs (even if style differs from your preference).
- 80-94: Minor potential edge-case risks.
- 50-79: Contains verified bugs or missing error handling for external calls.
- 0-49: Critical security exploits or fatal crashes.

MANDATORY RULES:
- Output ONLY valid JSON matching the schema below.
- No markdown or explanations outside JSON.
- If the diff has no verifiable bugs, you MUST return an empty array: "findings": [].
- Every finding must explain: (1) The concrete bug, (2) Why it breaks, (3) The exact fix.

LANGUAGE (mandatory):
${LANGUAGE_RULES[request.language]}

JSON SCHEMA:
${JSON_SCHEMA}

Review the following ${request.files.length} changed file(s):

${fileBlocks}`;
}

function truncateDiff(diff: string, maxChars = 12000): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  return `${diff.slice(0, maxChars)}\n... [truncated]`;
}
