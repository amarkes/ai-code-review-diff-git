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
}

export interface ReviewResult {
  provider: ProviderId;
  model: string;
  reviewedAt: string;
  overallSummary: string;
  files: FileReview[];
  rawMarkdown?: string;
}

export interface ReviewRequest {
  provider: ProviderId;
  model: string;
  apiKey: string;
  files: Array<{
    path: string;
    status: FileChangeStatus;
    diff: string;
  }>;
}
