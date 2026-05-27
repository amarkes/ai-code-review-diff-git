import type { ProviderId } from '../../shared/types';

export type ReviewErrorCode =
  | 'quota_exceeded'
  | 'rate_limited'
  | 'invalid_api_key'
  | 'forbidden'
  | 'model_not_found'
  | 'payload_too_large'
  | 'unknown';

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;
  readonly provider: ProviderId;
  readonly status: number;

  constructor(
    provider: ProviderId,
    status: number,
    code: ReviewErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReviewError';
    this.code = code;
    this.provider = provider;
    this.status = status;
  }
}

export function throwProviderApiError(
  provider: ProviderId,
  status: number,
  body: string,
): never {
  const parsed = tryParseJson(body);
  const apiMessage =
    typeof parsed?.error?.message === 'string'
      ? parsed.error.message
      : body.slice(0, 200);

  const code = mapStatusToCode(status, apiMessage);
  const message = buildMessage(provider, status, code, apiMessage);
  throw new ReviewError(provider, status, code, message);
}

function mapStatusToCode(status: number, apiMessage: string): ReviewErrorCode {
  const lower = apiMessage.toLowerCase();
  if (status === 429) {
    return lower.includes('quota') ? 'quota_exceeded' : 'rate_limited';
  }
  if (status === 401) {
    return 'invalid_api_key';
  }
  if (status === 403) {
    return lower.includes('quota') ? 'quota_exceeded' : 'forbidden';
  }
  if (status === 404) {
    return 'model_not_found';
  }
  if (status === 413) {
    return 'payload_too_large';
  }
  return 'unknown';
}

function buildMessage(
  provider: ProviderId,
  status: number,
  code: ReviewErrorCode,
  apiMessage: string,
): string {
  const name = provider === 'gemini' ? 'Gemini' : 'Claude';

  switch (code) {
    case 'quota_exceeded':
      return `${name} (${status}): quota exceeded. Check billing/plan or wait for reset. ${provider === 'gemini' ? 'https://ai.google.dev/gemini-api/docs/rate-limits' : 'https://console.anthropic.com/'} — or switch provider in the panel.`;
    case 'rate_limited':
      return `${name} (${status}): too many requests. Wait a minute and try again with fewer files.`;
    case 'invalid_api_key':
      return `${name} (${status}): invalid API key. Remove and save a new key in the panel.`;
    case 'forbidden':
      return `${name} (${status}): access denied. ${apiMessage}`;
    case 'model_not_found':
      return `${name} (${status}): model not found. Check aiCodeReview.${provider}Model in settings.`;
    case 'payload_too_large':
      return `${name} (${status}): diff too large. Select fewer files and try again.`;
    default:
      return `${name} API error (${status}): ${apiMessage}`;
  }
}

function tryParseJson(text: string): { error?: { message?: string } } | null {
  try {
    return JSON.parse(text) as { error?: { message?: string } };
  } catch {
    return null;
  }
}

export function isReviewError(error: unknown): error is ReviewError {
  return error instanceof ReviewError;
}
