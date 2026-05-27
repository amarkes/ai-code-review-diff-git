import * as path from 'node:path';
import type { WorkspaceConfiguration } from 'vscode';
import { DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL } from '../shared/models';
import type {
  ModifiedFile,
  ProviderId,
  ReviewLanguage,
  ReviewRequest,
  ReviewResult,
} from '../shared/types';
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
        ? (this.config.get<string>('aiCodeReview.geminiModel') ?? DEFAULT_GEMINI_MODEL)
        : (this.config.get<string>('aiCodeReview.claudeModel') ?? DEFAULT_CLAUDE_MODEL);

    const filesWithDiff = await Promise.all(
      selected.map(async (file) => ({
        path: path.relative(this.workspaceRoot, file.path),
        status: file.status,
        diff: await this.gitService.getDiff(file.path, file.status),
      })),
    );

    const language = (this.config.get<ReviewLanguage>('aiCodeReview.language') ?? 'en') as ReviewLanguage;

    const request: ReviewRequest = {
      provider,
      model,
      apiKey,
      language,
      files: filesWithDiff,
    };

    return provider === 'gemini'
      ? reviewWithGemini(request)
      : reviewWithClaude(request);
  }
}
