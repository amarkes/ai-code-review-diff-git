import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProviderId } from '@shared/types';
import { Button } from './components/Button';
import { FileList } from './components/FileList';
import { HistoryDashboard } from './components/HistoryDashboard';
import { ModelSelector } from './components/ModelSelector';
import { ReviewResults } from './components/ReviewResults';
import { useExtensionState } from './hooks/useExtensionState';

function formatLastReviewDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');

  const {
    state,
    error,
    errorCode,
    apiKeyInput,
    setApiKeyInput,
    setProvider,
    setModel,
    saveApiKey,
    clearApiKey,
    setLanguage,
    refreshFiles,
    toggleFile,
    selectAll,
    runReview,
    clearHistory,
    openInEditor,
    hasCurrentKey,
    currentKeyHint,
    isEditingKey,
    startEditingKey,
    currentModel,
    selectedCount,
  } = useExtensionState();

  const canReview =
    hasCurrentKey && selectedCount > 0 && !state.isReviewing && state.workspaceName;

  const missingForReview = [
    !hasCurrentKey && t('review.needApiKey'),
    selectedCount === 0 && t('review.needFiles'),
    !state.workspaceName && t('review.needWorkspace'),
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-screen flex-col gap-4 p-3 max-w-4xl mx-auto w-full">
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h1 className="text-base font-semibold">{t('app.title')}</h1>
          <p className="text-xs text-vscode-muted">
            {state.workspaceName
              ? t('app.workspace', { name: state.workspaceName })
              : t('app.noWorkspace')}
          </p>
        </div>
        <button
          type="button"
          onClick={openInEditor}
          title={t('app.openInEditor')}
          className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-vscode-muted hover:border-white/20 hover:text-vscode-fg transition-colors"
        >
          <span>↗</span>
          <span>{t('app.openInEditor')}</span>
        </button>
      </header>

      {/* Top Tab Switcher */}
      <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'review'
              ? 'bg-vscode-button text-vscode-buttonFg shadow'
              : 'text-vscode-muted hover:text-vscode-fg'
          }`}
        >
          {t('tabs.review')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-vscode-button text-vscode-buttonFg shadow'
              : 'text-vscode-muted hover:text-vscode-fg'
          }`}
        >
          {t('tabs.history')} ({state.history.length})
        </button>
      </div>

      {activeTab === 'history' ? (
        <HistoryDashboard
          history={state.history}
          stats={state.historyStats}
          onClearHistory={clearHistory}
        />
      ) : (
        <>
          <section className="flex items-center justify-between gap-2">
            <label className="text-xs text-vscode-muted">{t('language.label')}</label>
            <select
              value={state.language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'pt')}
              className="rounded border border-vscode-inputBorder bg-vscode-input px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </section>

          <section className="space-y-2">
            <label className="text-sm font-semibold">{t('provider.label')}</label>
            <div className="flex gap-2">
              {(['gemini', 'claude'] as ProviderId[]).map((id) => (
                <Button
                  key={id}
                  variant={state.provider === id ? 'primary' : 'secondary'}
                  onClick={() => setProvider(id)}
                >
                  {t(`provider.${id}`)}
                </Button>
              ))}
            </div>
          </section>

          <ModelSelector
            provider={state.provider}
            value={currentModel}
            onChange={(model) => setModel(state.provider, model)}
          />

          <section className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="api-key">
              {t('apiKey.label')}
            </label>

            {hasCurrentKey && !isEditingKey ? (
              <div className="space-y-2 rounded border border-green-500/30 bg-green-500/10 p-3">
                <p className="text-sm text-green-400">{t('apiKey.configured')}</p>
                {currentKeyHint && (
                  <p className="font-mono text-xs text-vscode-muted">
                    {t('apiKey.configuredHint', { hint: currentKeyHint })}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={startEditingKey}>
                    {t('apiKey.change')}
                  </Button>
                  <Button variant="ghost" onClick={clearApiKey}>
                    {t('apiKey.clear')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="api-key"
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && apiKeyInput.trim()) {
                        saveApiKey();
                      }
                    }}
                    placeholder={t('apiKey.placeholder')}
                    className="min-w-0 flex-1 rounded border border-vscode-inputBorder bg-vscode-input px-2 py-1.5 text-sm outline-none focus:border-vscode-focus"
                    autoFocus={isEditingKey}
                  />
                  <Button variant="secondary" onClick={saveApiKey} disabled={!apiKeyInput.trim()}>
                    {t('apiKey.save')}
                  </Button>
                </div>
                {!hasCurrentKey && (
                  <p className="text-xs text-vscode-warning">{t('apiKey.missing')}</p>
                )}
              </div>
            )}

            <p className="text-xs text-vscode-muted">{t('apiKey.persistNote')}</p>
          </section>

          <FileList
            files={state.files}
            selectedCount={selectedCount}
            onToggle={toggleFile}
            onSelectAll={selectAll}
            onRefresh={refreshFiles}
          />

          <div className="space-y-2">
            <Button className="w-full" onClick={runReview} disabled={!canReview}>
              {state.isReviewing ? t('review.running') : t('review.run')}
            </Button>

            {/* Last review indicator below the button */}
            {state.lastReviewTimestamp && (
              <div className="flex flex-col items-center gap-1 rounded bg-white/[0.02] p-2 border border-white/5 text-[11px] text-vscode-muted">
                <div className="flex items-center gap-1.5">
                  <span>🕒</span>
                  <span>
                    {t('review.lastReviewAt', {
                      date: formatLastReviewDate(state.lastReviewTimestamp, i18n.language),
                    })}
                  </span>
                </div>
                {state.lastReview?.usage && (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-vscode-muted">
                    <span className="text-sky-300">
                      {state.lastReview.usage.totalTokens.toLocaleString()} tokens
                    </span>
                    <span>·</span>
                    <span className="text-green-400">
                      ${state.lastReview.usage.estimatedCostUsd.toFixed(4)} USD
                    </span>
                  </div>
                )}
              </div>
            )}

            {!canReview && missingForReview.length > 0 && (
              <p className="text-center text-xs text-vscode-warning">
                {t('review.disabledReason', { items: missingForReview.join(' · ') })}
              </p>
            )}
          </div>

          <ReviewResults
            result={state.lastReview}
            error={error}
            errorCode={errorCode}
            language={state.language}
          />
        </>
      )}
    </div>
  );
}
