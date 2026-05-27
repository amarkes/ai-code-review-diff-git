import type { ReviewRequest, ReviewResult } from '../../shared/types';
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
    throw new Error(`Claude API error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data.content?.find((block) => block.type === 'text')?.text ?? '';
  if (!text.trim()) {
    throw new Error('Claude returned an empty response.');
  }

  return parseReviewResponse(text, request);
}
