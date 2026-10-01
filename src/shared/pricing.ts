import type { ProviderId } from './types';

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING_TABLE: Record<string, ModelPricing> = {
  // Gemini Models
  'gemini-3.5-flash-lite': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-3.1-flash-lite': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-3.5-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-3.6-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-3.7-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-3.8-flash': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'gemini-3.1-pro-preview': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-2.0-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-2.0-flash-lite': { inputPerMillion: 0.075, outputPerMillion: 0.30 },

  // Claude Models
  'claude-3-5-haiku-20241022': { inputPerMillion: 0.80, outputPerMillion: 4.00 },
  'claude-haiku-4-5-20251001': { inputPerMillion: 1.00, outputPerMillion: 5.00 },
  'claude-sonnet-4-20250514': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'claude-3-opus-20240229': { inputPerMillion: 15.00, outputPerMillion: 75.00 },
};

export function calculateEstimatedCost(
  provider: ProviderId,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing =
    PRICING_TABLE[model] ??
    (provider === 'gemini'
      ? { inputPerMillion: 0.10, outputPerMillion: 0.40 }
      : { inputPerMillion: 3.00, outputPerMillion: 15.00 });

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPerMillion;

  return Number((inputCost + outputCost).toFixed(6));
}
