import { calculateEstimatedCost } from '../../shared/pricing';
import type { ReviewRequest, ReviewResult } from '../../shared/types';
import { throwProviderApiError } from './apiErrors';
import { buildReviewPrompt } from './promptBuilder';
import { parseReviewResponse } from './responseParser';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

export async function reviewWithClaude(request: ReviewRequest): Promise<ReviewResult> {
  const prompt = buildReviewPrompt(request);

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': request.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: 8192,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throwProviderApiError('claude', response.status, body);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };

  const text = data.content?.find((block) => block.type === 'text')?.text ?? '';
  if (!text.trim()) {
    throw new Error('Claude returned an empty response.');
  }

  const result = parseReviewResponse(text, request);

  const promptTokens = data.usage?.input_tokens ?? Math.round(prompt.length / 4);
  const completionTokens = data.usage?.output_tokens ?? Math.round(text.length / 4);
  const totalTokens = promptTokens + completionTokens;

  const estimatedCostUsd = calculateEstimatedCost(
    'claude',
    request.model,
    promptTokens,
    completionTokens,
  );

  result.usage = {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd,
  };

  return result;
}
