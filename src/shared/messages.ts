import type { ModifiedFile, ProviderId, ReviewResult } from './types';

export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'getState' }
  | { type: 'setProvider'; provider: ProviderId }
  | { type: 'setModel'; provider: ProviderId; model: string }
  | { type: 'setApiKey'; provider: ProviderId; apiKey: string }
  | { type: 'clearApiKey'; provider: ProviderId }
  | { type: 'setLanguage'; language: 'en' | 'pt' }
  | { type: 'refreshFiles' }
  | { type: 'toggleFile'; path: string; selected: boolean }
  | { type: 'selectAll'; selected: boolean }
  | { type: 'runReview' };

export type ExtensionToWebviewMessage =
  | { type: 'state'; payload: WebviewState }
  | { type: 'reviewStarted' }
  | { type: 'reviewCompleted'; result: ReviewResult }
  | { type: 'reviewFailed'; error: string; errorCode?: string }
  | { type: 'filesUpdated'; files: ModifiedFile[] }
  | { type: 'notice'; message: string; level: 'info' | 'warning' | 'error' };

export interface WebviewState {
  provider: ProviderId;
  language: 'en' | 'pt';
  hasGeminiKey: boolean;
  hasClaudeKey: boolean;
  /** Masked hint (e.g. ••••••ab12) — never the full key */
  geminiKeyHint: string | null;
  claudeKeyHint: string | null;
  files: ModifiedFile[];
  selectedPaths: string[];
  workspaceName: string | null;
  isReviewing: boolean;
  lastReview: ReviewResult | null;
  geminiModel: string;
  claudeModel: string;
}
