import type { ExtensionContext, SecretStorage } from 'vscode';
import type { ProviderId } from '../shared/types';

const SECRET_KEYS: Record<ProviderId, string> = {
  gemini: 'aiCodeReview.apiKey.gemini',
  claude: 'aiCodeReview.apiKey.claude',
};

export class SecretsService {
  constructor(private readonly storage: SecretStorage) {}

  static fromContext(context: ExtensionContext): SecretsService {
    return new SecretsService(context.secrets);
  }

  async getApiKey(provider: ProviderId): Promise<string | undefined> {
    return this.storage.get(SECRET_KEYS[provider]);
  }

  async setApiKey(provider: ProviderId, apiKey: string): Promise<void> {
    await this.storage.store(SECRET_KEYS[provider], apiKey.trim());
  }

  async clearApiKey(provider: ProviderId): Promise<void> {
    await this.storage.delete(SECRET_KEYS[provider]);
  }

  async hasApiKey(provider: ProviderId): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return Boolean(key?.trim());
  }

  async getApiKeyHint(provider: ProviderId): Promise<string | null> {
    const key = await this.getApiKey(provider);
    if (!key?.trim()) {
      return null;
    }
    const trimmed = key.trim();
    const suffix = trimmed.slice(-4);
    return `••••••${suffix}`;
  }
}
