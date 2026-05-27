import type { FileReview, ReviewResult, ReviewRequest } from '../../shared/types';

interface ParsedAiResponse {
  overallSummary?: string;
  files?: Array<{
    path?: string;
    summary?: string;
    findings?: Array<{
      severity?: string;
      title?: string;
      detail?: string;
      line?: number;
    }>;
  }>;
}

const VALID_SEVERITIES = new Set(['critical', 'warning', 'suggestion', 'info']);

export function parseReviewResponse(
  raw: string,
  request: ReviewRequest,
): ReviewResult {
  const jsonText = extractJson(raw);
  let parsed: ParsedAiResponse;

  try {
    parsed = JSON.parse(jsonText) as ParsedAiResponse;
  } catch {
    return fallbackFromMarkdown(raw, request);
  }

  const files: FileReview[] = (parsed.files ?? []).map((file, index) => ({
    path: file.path ?? request.files[index]?.path ?? `file-${index + 1}`,
    summary: file.summary ?? '',
    findings: (file.findings ?? []).map((finding) => ({
      severity: VALID_SEVERITIES.has(finding.severity ?? '')
        ? (finding.severity as FileReview['findings'][0]['severity'])
        : 'info',
      title: finding.title ?? 'Finding',
      detail: finding.detail ?? '',
      line: typeof finding.line === 'number' ? finding.line : undefined,
    })),
  }));

  if (files.length === 0 && request.files.length > 0) {
    return fallbackFromMarkdown(raw, request);
  }

  return {
    provider: request.provider,
    model: request.model,
    reviewedAt: new Date().toISOString(),
    overallSummary: parsed.overallSummary ?? 'Review completed.',
    files,
    rawMarkdown: raw,
  };
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

function fallbackFromMarkdown(raw: string, request: ReviewRequest): ReviewResult {
  return {
    provider: request.provider,
    model: request.model,
    reviewedAt: new Date().toISOString(),
    overallSummary: 'Review completed (unstructured response).',
    files: request.files.map((file) => ({
      path: file.path,
      summary: 'See raw response.',
      findings: [
        {
          severity: 'info',
          title: 'Raw review',
          detail: raw.slice(0, 2000),
        },
      ],
    })),
    rawMarkdown: raw,
  };
}
