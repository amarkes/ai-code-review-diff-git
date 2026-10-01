import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HistoryStats, ReviewHistoryEntry } from '@shared/types';
import { Button } from './Button';
import { QualityScore } from './QualityScore';

interface HistoryDashboardProps {
  history: ReviewHistoryEntry[];
  stats: HistoryStats;
  onClearHistory: () => void;
}

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return String(tokens);
}

function formatCost(costUsd: number): string {
  if (costUsd === 0) {
    return '$0.00';
  }
  if (costUsd < 0.001) {
    return `$${costUsd.toFixed(4)}`;
  }
  return `$${costUsd.toFixed(3)}`;
}

export function HistoryDashboard({
  history,
  stats,
  onClearHistory,
}: HistoryDashboardProps) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <p className="text-[11px] font-medium text-vscode-muted">{t('history.kpi.totalCost')}</p>
          <p className="mt-1 text-lg font-bold text-green-400 tabular-nums">
            {formatCost(stats.totalCostUsd)} <span className="text-[10px] font-normal text-vscode-muted">USD</span>
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <p className="text-[11px] font-medium text-vscode-muted">{t('history.kpi.totalTokens')}</p>
          <p className="mt-1 text-lg font-bold text-sky-400 tabular-nums">
            {formatTokens(stats.totalTokens)}
          </p>
          <p className="text-[9px] text-vscode-muted">
            {formatTokens(stats.totalPromptTokens)} in · {formatTokens(stats.totalCompletionTokens)} out
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <p className="text-[11px] font-medium text-vscode-muted">{t('history.kpi.totalReviews')}</p>
          <p className="mt-1 text-lg font-bold text-indigo-300 tabular-nums">
            {stats.totalReviews}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <p className="text-[11px] font-medium text-vscode-muted">{t('history.kpi.avgScore')}</p>
          <p className="mt-1 text-lg font-bold text-amber-300 tabular-nums">
            {stats.totalReviews > 0 ? `${stats.avgQualityScore}%` : '—'}
          </p>
        </div>
      </div>

      {/* Header with Clear button */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-muted">
          {t('history.recentTitle')} ({history.length})
        </h2>
        {history.length > 0 && (
          <div>
            {showConfirmClear ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => {
                    onClearHistory();
                    setShowConfirmClear(false);
                  }}
                >
                  {t('history.confirmClear')}
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setShowConfirmClear(false)}
                >
                  {t('history.cancel')}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="text-xs text-vscode-muted hover:text-red-400 transition-colors"
              >
                {t('history.clear')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-vscode-muted">
          {t('history.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(entry.id)}
                  className="flex w-full flex-col gap-1.5 p-2.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-vscode-muted">
                      {formatDate(entry.timestamp, i18n.language)}
                    </span>
                    <span className="font-semibold tabular-nums text-xs">
                      {entry.qualityScore}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-vscode-fg">
                      {entry.provider}
                    </span>
                    <span className="truncate text-vscode-muted" title={entry.model}>
                      {entry.model.replace(/^claude-/, '').replace(/^gemini-/, '')}
                    </span>
                    <span className="text-vscode-muted">·</span>
                    <span className="text-vscode-muted">
                      {t('history.filesCount', { count: entry.filesCount })}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-green-400">
                      {formatCost(entry.estimatedCostUsd)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-vscode-muted">
                    <span>{formatTokens(entry.totalTokens)} tokens</span>
                    <span>({formatTokens(entry.promptTokens)} in / {formatTokens(entry.completionTokens)} out)</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/[0.02] p-2.5 text-xs space-y-2">
                    {entry.workspaceName && (
                      <p className="text-vscode-muted text-[11px]">
                        <strong>{t('history.workspace')}:</strong> {entry.workspaceName}
                      </p>
                    )}
                    <div>
                      <p className="font-medium text-[11px] text-vscode-muted mb-1">
                        {t('history.summary')}:
                      </p>
                      <p className="text-vscode-fg text-[11px] leading-relaxed whitespace-pre-wrap">
                        {entry.overallSummary}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
