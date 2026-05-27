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
Analyze only the provided diffs. Be concise, actionable, and specific.

LANGUAGE (mandatory): ${LANGUAGE_RULES[request.language]}

SCORING:
- qualityScore is an integer from 0 to 100 indicating how good the changes are overall (100 = excellent, production-ready).
- Each file also gets qualityScore 0-100 for that file's diff.
- Base scores on bugs, security, style, tests, and maintainability found in the diff.

Respond ONLY with valid JSON matching this schema (no markdown fences):
${JSON_SCHEMA}

Omit "line" in findings when unknown.

Review the following ${request.files.length} changed file(s):

${fileBlocks}`;
}

function truncateDiff(diff: string, maxChars = 12000): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  return `${diff.slice(0, maxChars)}\n... [truncated]`;
}
