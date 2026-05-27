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

  return `You are a senior software engineer performing a code review.

Review ONLY the provided git diff.
Do not speculate about files, code, or context outside the diff.

GOALS:
- Find real issues only.
- Minimize false positives.
- Be concise and token-efficient.
- Prefer high-impact findings over stylistic comments.

FOCUS:
1. Bugs and regressions
2. Security issues
3. Performance problems
4. Breaking changes
5. Maintainability risks
6. Missing validation/error handling
7. Test coverage gaps (only if clearly relevant)

IGNORE:
- Pure style preferences
- Naming suggestions unless harmful
- Refactors not required for correctness
- Hypothetical edge cases without evidence in diff

LANGUAGE (mandatory):
${LANGUAGE_RULES[request.language]}

SCORING:
- qualityScore: integer 0-100 for the overall diff (100 = production-ready, no issues).
- Each file also gets qualityScore 0-100 for that file's diff.
- Base scores on correctness, safety, maintainability, and test confidence.
- Penalize only concrete issues found in the diff.

RULES:
- Output ONLY valid JSON.
- No markdown.
- No explanations outside JSON.
- Keep findings short and actionable.
- Omit "line" when unknown.
- If no issues are found, return empty findings arrays and a high score.

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
