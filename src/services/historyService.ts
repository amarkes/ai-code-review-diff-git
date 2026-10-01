import type * as vscode from 'vscode';
import type { HistoryStats, ReviewHistoryEntry } from '../shared/types';

const STORAGE_KEY = 'aiCodeReview.reviewHistory';
const MAX_HISTORY_ENTRIES = 500;

export class HistoryService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  getHistory(): ReviewHistoryEntry[] {
    return this.context.globalState.get<ReviewHistoryEntry[]>(STORAGE_KEY, []);
  }

  async addEntry(entry: ReviewHistoryEntry): Promise<void> {
    const current = this.getHistory();
    // Newest entries first, capped at MAX_HISTORY_ENTRIES
    const updated = [entry, ...current.filter((e) => e.id !== entry.id)].slice(
      0,
      MAX_HISTORY_ENTRIES,
    );
    await this.context.globalState.update(STORAGE_KEY, updated);
  }

  async clearHistory(): Promise<void> {
    await this.context.globalState.update(STORAGE_KEY, []);
  }

  getLastReviewTimestamp(): string | null {
    const history = this.getHistory();
    return history.length > 0 ? history[0].timestamp : null;
  }

  getStats(): HistoryStats {
    const history = this.getHistory();
    if (history.length === 0) {
      return {
        totalReviews: 0,
        totalCostUsd: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        avgQualityScore: 0,
      };
    }

    let totalCostUsd = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let scoreSum = 0;

    for (const entry of history) {
      totalCostUsd += entry.estimatedCostUsd;
      totalPromptTokens += entry.promptTokens;
      totalCompletionTokens += entry.completionTokens;
      totalTokens += entry.totalTokens;
      scoreSum += entry.qualityScore;
    }

    return {
      totalReviews: history.length,
      totalCostUsd: Number(totalCostUsd.toFixed(5)),
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens,
      avgQualityScore: Math.round(scoreSum / history.length),
    };
  }
}
