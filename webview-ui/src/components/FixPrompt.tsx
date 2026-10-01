import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReviewLanguage, ReviewResult } from '@shared/types';
import { buildFixPrompt, countActionableFindings } from '@shared/fixPrompt';
import { postMessage } from '../vscode';
import { Button } from './Button';

interface FixPromptProps {
  result: ReviewResult;
  language: ReviewLanguage;
}

export function FixPrompt({ result, language }: FixPromptProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const count = countActionableFindings(result);
  const prompt = useMemo(() => buildFixPrompt(result, language), [result, language]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (count === 0) {
    return null;
  }

  const copy = () => {
    postMessage({ type: 'copyToClipboard', text: prompt });
    setCopied(true);
  };

  return (
    <div className="space-y-2 rounded border border-vscode-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t('review.fixPrompt.title')}</h2>
          <p className="text-xs text-vscode-muted">{t('review.fixPrompt.hint', { count })}</p>
        </div>
        <Button className="shrink-0" onClick={copy}>
          {copied ? t('review.fixPrompt.copied') : t('review.fixPrompt.copy')}
        </Button>
      </div>
      <details>
        <summary className="cursor-pointer text-xs text-vscode-muted">
          {t('review.fixPrompt.preview')}
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-vscode-input p-2 font-mono text-xs">
          {prompt}
        </pre>
      </details>
    </div>
  );
}
