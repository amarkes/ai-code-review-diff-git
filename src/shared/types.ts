export type ProviderId = 'gemini' | 'claude';

export type FileChangeStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'copied';

export interface ModifiedFile {
  path: string;
  status: FileChangeStatus;
  selected: boolean;
}

export interface FileReviewFinding {
  severity: 'critical' | 'warning' | 'suggestion' | 'info';
  title: string;
  detail: string;
  line?: number;
}

export interface FileReview {
  path: string;
  summary: string;
  findings: FileReviewFinding[];
  /** 0–100 quality score for this file */
  qualityScore?: number;
}

export interface ReviewResult {
  provider: ProviderId;
  model: string;
  reviewedAt: string;
  overallSummary: string;
  /** 0–100 overall quality score */
  qualityScore: number;
  files: FileReview[];
  rawMarkdown?: string;
}

export type ReviewLanguage = 'en' | 'pt';

export interface ReviewRequest {
  provider: ProviderId;
  model: string;
  apiKey: string;
  language: ReviewLanguage;
  files: Array<{
    path: string;
    status: FileChangeStatus;
    diff: string;
  }>;
}
