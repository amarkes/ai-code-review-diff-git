import { useTranslation } from 'react-i18next';
import type { ReviewResult } from '@shared/types';
import { QualityScore } from './QualityScore';

interface ReviewResultsProps {
  result: ReviewResult | null;
  error: string | null;
  errorCode?: string | null;
}

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  suggestion: 'border-l-blue-400',
  info: 'border-l-gray-400',
};

export function ReviewResults({ result, error, errorCode }: ReviewResultsProps) {
  const { t } = useTranslation();

  if (error) {
    const friendly =
      errorCode && t(`review.errors.${errorCode}`, { defaultValue: '' })
        ? t(`review.errors.${errorCode}`)
        : null;

    return (
      <section className="rounded border border-red-500/40 bg-red-500/10 p-3">
        <h2 className="text-sm font-semibold text-vscode-error">{t('review.error')}</h2>
        {friendly && <p className="mt-1 text-sm font-medium">{friendly}</p>}
        <p className={`text-sm ${friendly ? 'mt-2 text-xs text-vscode-muted' : 'mt-1'}`}>
          {error}
        </p>
      </section>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="rounded border border-vscode-border p-3 space-y-3">
        <QualityScore score={result.qualityScore} label={t('review.qualityScore')} />
        <div>
          <h2 className="text-sm font-semibold">{t('review.overall')}</h2>
          <p className="mt-1 text-sm leading-relaxed">{result.overallSummary}</p>
        </div>
      </div>

      {result.files.map((file) => (
        <article key={file.path} className="rounded border border-vscode-border p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-sm font-semibold" title={file.path}>
              {file.path}
            </h3>
            {file.qualityScore !== undefined && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-vscode-muted">
                {file.qualityScore}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-vscode-muted">{file.summary}</p>

          {file.findings.length === 0 ? (
            <p className="mt-2 text-sm text-vscode-muted">{t('review.noFindings')}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {file.findings.map((finding, index) => (
                <li
                  key={`${file.path}-${index}`}
                  className={`border-l-2 pl-2 ${severityBorder[finding.severity] ?? 'border-l-gray-400'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {t(`review.severity.${finding.severity}`)}
                    </span>
                    {finding.line !== undefined && (
                      <span className="text-xs text-vscode-muted">L{finding.line}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{finding.title}</p>
                  <p className="text-sm text-vscode-muted">{finding.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}
