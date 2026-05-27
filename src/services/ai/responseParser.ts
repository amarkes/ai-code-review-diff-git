import type { FileReview, ReviewResult, ReviewRequest } from '../../shared/types';

interface ParsedAiResponse {
  qualityScore?: number;
  overallSummary?: string;
  files?: Array<{
    path?: string;
    qualityScore?: number;
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
    qualityScore: clampScore(file.qualityScore),
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

  const overallScore =
    clampScore(parsed.qualityScore) ??
    averageDefined(files.map((f) => f.qualityScore)) ??
    estimateScoreFromFindings(files);

  return {
    provider: request.provider,
    model: request.model,
    reviewedAt: new Date().toISOString(),
    overallSummary: parsed.overallSummary ?? 'Review completed.',
    qualityScore: overallScore,
    files,
    rawMarkdown: raw,
  };
}

function clampScore(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function averageDefined(values: Array<number | undefined>): number | undefined {
  const valid = values.filter((v): v is number => typeof v === 'number');
  if (valid.length === 0) {
    return undefined;
  }
  return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
}

function estimateScoreFromFindings(files: FileReview[]): number {
  let penalty = 0;
  for (const file of files) {
    for (const finding of file.findings) {
      switch (finding.severity) {
        case 'critical':
          penalty += 25;
          break;
        case 'warning':
          penalty += 12;
          break;
        case 'suggestion':
          penalty += 5;
          break;
        default:
          penalty += 2;
      }
    }
  }
  return Math.max(0, Math.min(100, 100 - penalty));
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
  const files: FileReview[] = request.files.map((file) => ({
    path: file.path,
    summary: 'See raw response.',
    findings: [
      {
        severity: 'info',
        title: 'Raw review',
        detail: raw.slice(0, 2000),
      },
    ],
  }));

  return {
    provider: request.provider,
    model: request.model,
    reviewedAt: new Date().toISOString(),
    overallSummary: 'Review completed (unstructured response).',
    qualityScore: estimateScoreFromFindings(files),
    files,
    rawMarkdown: raw,
  };
}
