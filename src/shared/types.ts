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

export interface ReviewUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
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
  usage?: ReviewUsage;
}

export interface ReviewHistoryEntry {
  id: string;
  timestamp: string;
  workspaceName: string;
  provider: ProviderId;
  model: string;
  filesCount: number;
  qualityScore: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  overallSummary: string;
}

export interface HistoryStats {
  totalReviews: number;
  totalCostUsd: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  avgQualityScore: number;
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
