import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WebviewState } from '@shared/messages';
import type { ProviderId } from '@shared/types';
import { onExtensionMessage, postMessage } from '../vscode';

const defaultState: WebviewState = {
  provider: 'gemini',
  language: 'en',
  hasGeminiKey: false,
  hasClaudeKey: false,
  files: [],
  selectedPaths: [],
  workspaceName: null,
  isReviewing: false,
  lastReview: null,
  geminiModel: 'gemini-2.0-flash',
  claudeModel: 'claude-sonnet-4-20250514',
};

export function useExtensionState() {
  const { i18n } = useTranslation();
  const [state, setState] = useState<WebviewState>(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    postMessage({ type: 'ready' });
    return onExtensionMessage((message) => {
      switch (message.type) {
        case 'state':
          setState(message.payload);
          void i18n.changeLanguage(message.payload.language);
          break;
        case 'reviewFailed':
          setError(message.error);
          break;
        case 'reviewCompleted':
          setError(null);
          break;
        case 'reviewStarted':
          setError(null);
          break;
      }
    });
  }, [i18n]);

  const setProvider = useCallback((provider: ProviderId) => {
    postMessage({ type: 'setProvider', provider });
  }, []);

  const saveApiKey = useCallback(() => {
    if (!apiKeyInput.trim()) {
      return;
    }
    postMessage({ type: 'setApiKey', provider: state.provider, apiKey: apiKeyInput });
    setApiKeyInput('');
  }, [apiKeyInput, state.provider]);

  const clearApiKey = useCallback(() => {
    postMessage({ type: 'clearApiKey', provider: state.provider });
    setApiKeyInput('');
  }, [state.provider]);

  const setLanguage = useCallback((language: 'en' | 'pt') => {
    postMessage({ type: 'setLanguage', language });
  }, []);

  const refreshFiles = useCallback(() => {
    postMessage({ type: 'refreshFiles' });
  }, []);

  const toggleFile = useCallback((path: string, selected: boolean) => {
    postMessage({ type: 'toggleFile', path, selected });
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    postMessage({ type: 'selectAll', selected });
  }, []);

  const runReview = useCallback(() => {
    postMessage({ type: 'runReview' });
  }, []);

  const hasCurrentKey =
    state.provider === 'gemini' ? state.hasGeminiKey : state.hasClaudeKey;

  const currentModel =
    state.provider === 'gemini' ? state.geminiModel : state.claudeModel;

  const selectedCount = state.files.filter((f) => f.selected).length;

  return {
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
  };
}
