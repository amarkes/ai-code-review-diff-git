import type { ReviewRequest } from '../../shared/types';

const SYSTEM_PROMPT = `You are a senior software engineer performing a code review.
Analyze only the provided diffs. Be concise, actionable, and specific.
Respond ONLY with valid JSON matching this schema:
{
  "overallSummary": "string",
  "files": [
    {
      "path": "relative/file/path",
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
}
Omit "line" when unknown. No markdown fences.`;

export function buildReviewPrompt(request: ReviewRequest): string {
  const fileBlocks = request.files
    .map(
      (file) =>
        `### ${file.path} (${file.status})\n\`\`\`diff\n${truncateDiff(file.diff)}\n\`\`\``,
    )
    .join('\n\n');

  return `${SYSTEM_PROMPT}

Review the following ${request.files.length} changed file(s):

${fileBlocks}`;
}

function truncateDiff(diff: string, maxChars = 12000): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  return `${diff.slice(0, maxChars)}\n... [truncated]`;
}
