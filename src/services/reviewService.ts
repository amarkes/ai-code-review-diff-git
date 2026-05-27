import * as path from 'node:path';
import type { WorkspaceConfiguration } from 'vscode';
import type { ModifiedFile, ProviderId, ReviewRequest, ReviewResult } from '../shared/types';
import { reviewWithClaude } from './ai/claudeProvider';
import { reviewWithGemini } from './ai/geminiProvider';
import type { GitService } from './gitService';
import type { SecretsService } from './secretsService';

export class ReviewService {
  constructor(
    private readonly gitService: GitService,
    private readonly secretsService: SecretsService,
    private readonly config: WorkspaceConfiguration,
    private readonly workspaceRoot: string,
  ) {}

  async runReview(
    provider: ProviderId,
    files: ModifiedFile[],
  ): Promise<ReviewResult> {
    const selected = files.filter((file) => file.selected);
    if (selected.length === 0) {
      throw new Error('No files selected for review.');
    }

    const apiKey = await this.secretsService.getApiKey(provider);
    if (!apiKey?.trim()) {
      throw new Error(`API key for ${provider} is not configured.`);
    }

    const model =
      provider === 'gemini'
        ? (this.config.get<string>('aiCodeReview.geminiModel') ?? 'gemini-2.0-flash')
        : (this.config.get<string>('aiCodeReview.claudeModel') ?? 'claude-sonnet-4-20250514');

    const filesWithDiff = await Promise.all(
      selected.map(async (file) => ({
        path: path.relative(this.workspaceRoot, file.path),
        status: file.status,
        diff: await this.gitService.getDiff(file.path, file.status),
      })),
    );

    const request: ReviewRequest = {
      provider,
      model,
      apiKey,
      files: filesWithDiff,
    };

    return provider === 'gemini'
      ? reviewWithGemini(request)
      : reviewWithClaude(request);
  }
}
