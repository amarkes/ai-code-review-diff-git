import { useTranslation } from 'react-i18next';
import type { ProviderId } from '@shared/types';
import { Button } from './components/Button';
import { FileList } from './components/FileList';
import { ReviewResults } from './components/ReviewResults';
import { useExtensionState } from './hooks/useExtensionState';

export function App() {
  const { t } = useTranslation();
  const {
    state,
    error,
    apiKeyInput,
    setApiKeyInput,
    setProvider,
    saveApiKey,
    clearApiKey,
    setLanguage,
    refreshFiles,
    toggleFile,
    selectAll,
    runReview,
    hasCurrentKey,
    currentModel,
    selectedCount,
  } = useExtensionState();

  const canReview =
    hasCurrentKey && selectedCount > 0 && !state.isReviewing && state.workspaceName;

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
        <p className="text-xs text-vscode-muted">
          {t('provider.model', { model: currentModel })}
        </p>
      </section>

      <section className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="api-key">
          {t('apiKey.label')}
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={t('apiKey.placeholder')}
            className="min-w-0 flex-1 rounded border border-vscode-inputBorder bg-vscode-input px-2 py-1.5 text-sm outline-none focus:border-vscode-focus"
          />
          <Button variant="secondary" onClick={saveApiKey} disabled={!apiKeyInput.trim()}>
            {t('apiKey.save')}
          </Button>
          {hasCurrentKey && (
            <Button variant="ghost" onClick={clearApiKey}>
              {t('apiKey.clear')}
            </Button>
          )}
        </div>
        <p className={`text-xs ${hasCurrentKey ? 'text-green-400' : 'text-vscode-warning'}`}>
          {hasCurrentKey ? t('apiKey.configured') : t('apiKey.missing')}
        </p>
      </section>

      <FileList
        files={state.files}
        selectedCount={selectedCount}
        onToggle={toggleFile}
        onSelectAll={selectAll}
        onRefresh={refreshFiles}
      />

      <Button className="w-full" onClick={runReview} disabled={!canReview}>
        {state.isReviewing ? t('review.running') : t('review.run')}
      </Button>

      <ReviewResults result={state.lastReview} error={error} />
    </div>
  );
}
