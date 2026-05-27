import type { ProviderId } from './types';

export type ModelTier = 'economy' | 'balanced' | 'quality';

export interface ModelOption {
  id: string;
  provider: ProviderId;
  tier: ModelTier;
}

/** Cheapest first — default is the first entry per provider */
export const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-2.5-flash-lite', provider: 'gemini', tier: 'economy' },
  { id: 'gemini-2.0-flash-lite', provider: 'gemini', tier: 'economy' },
  { id: 'gemini-2.5-flash', provider: 'gemini', tier: 'balanced' },
  { id: 'gemini-2.0-flash', provider: 'gemini', tier: 'balanced' },
];

export const CLAUDE_MODELS: ModelOption[] = [
  { id: 'claude-3-5-haiku-20241022', provider: 'claude', tier: 'economy' },
  { id: 'claude-haiku-4-5-20251001', provider: 'claude', tier: 'economy' },
  { id: 'claude-sonnet-4-20250514', provider: 'claude', tier: 'balanced' },
  { id: 'claude-3-5-sonnet-20241022', provider: 'claude', tier: 'balanced' },
];

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0].id;
export const DEFAULT_CLAUDE_MODEL = CLAUDE_MODELS[0].id;

export function modelsForProvider(provider: ProviderId): ModelOption[] {
  return provider === 'gemini' ? GEMINI_MODELS : CLAUDE_MODELS;
}

export function defaultModelForProvider(provider: ProviderId): string {
  return provider === 'gemini' ? DEFAULT_GEMINI_MODEL : DEFAULT_CLAUDE_MODEL;
}

export function isKnownModel(provider: ProviderId, modelId: string): boolean {
  return modelsForProvider(provider).some((m) => m.id === modelId);
}
