import { useTranslation } from 'react-i18next';
import type { ProviderId } from '@shared/types';
import { Button } from './components/Button';
import { FileList } from './components/FileList';
import { ModelSelector } from './components/ModelSelector';
import { ReviewResults } from './components/ReviewResults';
import { useExtensionState } from './hooks/useExtensionState';

export function App() {
  const { t } = useTranslation();
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
    <div className="flex min-h-screen flex-col gap-4 p-3">
      <header className="space-y-1">
        <h1 className="text-base font-semibold">{t('app.title')}</h1>
        <p className="text-xs text-vscode-muted">
          {state.workspaceName
            ? t('app.workspace', { name: state.workspaceName })
            : t('app.noWorkspace')}
        </p>
      </header>

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

      <div className="space-y-1">
        <Button className="w-full" onClick={runReview} disabled={!canReview}>
          {state.isReviewing ? t('review.running') : t('review.run')}
        </Button>
        {!canReview && missingForReview.length > 0 && (
          <p className="text-center text-xs text-vscode-warning">
            {t('review.disabledReason', { items: missingForReview.join(' · ') })}
          </p>
        )}
      </div>

      <ReviewResults result={state.lastReview} error={error} errorCode={errorCode} />
    </div>
  );
}
