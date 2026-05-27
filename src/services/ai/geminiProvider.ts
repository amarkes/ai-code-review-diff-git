import type { ReviewRequest, ReviewResult } from '../../shared/types';
import { throwProviderApiError } from './apiErrors';
import { buildReviewPrompt } from './promptBuilder';
import { parseReviewResponse } from './responseParser';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function reviewWithGemini(request: ReviewRequest): Promise<ReviewResult> {
  const prompt = buildReviewPrompt(request);
  const url = `${GEMINI_BASE}/${request.model}:generateContent?key=${encodeURIComponent(request.apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throwProviderApiError('gemini', response.status, body);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

  if (!text.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  return parseReviewResponse(text, request);
}
