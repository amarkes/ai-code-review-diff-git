import { useTranslation } from 'react-i18next';

interface QualityScoreProps {
  score: number;
  size?: 'sm' | 'lg';
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 90) {
    return 'text-green-400';
  }
  if (score >= 75) {
    return 'text-lime-400';
  }
  if (score >= 50) {
    return 'text-yellow-400';
  }
  return 'text-red-400';
}

function barColor(score: number): string {
  if (score >= 90) {
    return 'bg-green-500';
  }
  if (score >= 75) {
    return 'bg-lime-500';
  }
  if (score >= 50) {
    return 'bg-yellow-500';
  }
  return 'bg-red-500';
}

function scoreLabelKey(score: number): string {
  if (score >= 90) {
    return 'review.score.excellent';
  }
  if (score >= 75) {
    return 'review.score.good';
  }
  if (score >= 50) {
    return 'review.score.fair';
  }
  return 'review.score.poor';
}

export function QualityScore({ score, size = 'lg', label }: QualityScoreProps) {
  const { t } = useTranslation();
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const isLarge = size === 'lg';

  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-vscode-muted">{label}</p>}
      <div className="flex items-center gap-3">
        <span
          className={`font-bold tabular-nums ${scoreColor(clamped)} ${isLarge ? 'text-2xl' : 'text-sm'}`}
        >
          {clamped}%
        </span>
        <div className="min-w-0 flex-1">
          <div className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${isLarge ? 'h-2.5' : 'h-1.5'}`}>
            <div
              className={`h-full rounded-full transition-all ${barColor(clamped)}`}
              style={{ width: `${clamped}%` }}
            />
          </div>
          <p className={`mt-0.5 text-vscode-muted ${isLarge ? 'text-xs' : 'text-[10px]'}`}>
            {t(scoreLabelKey(clamped))}
          </p>
        </div>
      </div>
    </div>
  );
}
