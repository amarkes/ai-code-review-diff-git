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
  geminiKeyHint: null,
  claudeKeyHint: null,
  files: [],
  selectedPaths: [],
  workspaceName: null,
  isReviewing: false,
  lastReview: null,
  geminiModel: 'gemini-2.5-flash-lite',
  claudeModel: 'claude-3-5-haiku-20241022',
};

export function useExtensionState() {
  const { i18n } = useTranslation();
  const [state, setState] = useState<WebviewState>(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);

  useEffect(() => {
    const unsubscribe = onExtensionMessage((message) => {
      switch (message.type) {
        case 'state':
          setState(message.payload);
          void i18n.changeLanguage(message.payload.language);
          if (
            message.payload.provider === 'gemini'
              ? message.payload.hasGeminiKey
              : message.payload.hasClaudeKey
          ) {
            setIsEditingKey(false);
          }
          break;
        case 'reviewFailed':
          setError(message.error);
          setErrorCode(message.errorCode ?? null);
          break;
        case 'reviewCompleted':
          setError(null);
          setErrorCode(null);
          break;
        case 'reviewStarted':
          setError(null);
          setErrorCode(null);
          break;
      }
    });
    postMessage({ type: 'ready' });
    return unsubscribe;
  }, [i18n]);

  const setProvider = useCallback((provider: ProviderId) => {
    postMessage({ type: 'setProvider', provider });
  }, []);

  const setModel = useCallback((provider: ProviderId, model: string) => {
    postMessage({ type: 'setModel', provider, model });
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

  const currentKeyHint =
    state.provider === 'gemini' ? state.geminiKeyHint : state.claudeKeyHint;

  const currentModel =
    state.provider === 'gemini' ? state.geminiModel : state.claudeModel;

  const selectedCount = state.files.filter((f) => f.selected).length;

  const startEditingKey = useCallback(() => {
    setIsEditingKey(true);
    setApiKeyInput('');
  }, []);

  return {
    state,
    error,
    errorCode,
    apiKeyInput,
    setApiKeyInput,
    isEditingKey,
    setIsEditingKey,
    startEditingKey,
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
    currentModel,
    selectedCount,
  };
}
