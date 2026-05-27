import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage, WebviewState } from '../shared/messages';
import {
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_GEMINI_MODEL,
  defaultModelForProvider,
  isKnownModel,
} from '../shared/models';
import type { ModifiedFile, ProviderId, ReviewResult } from '../shared/types';
import { GitService } from '../services/gitService';
import { ReviewService } from '../services/reviewService';
import { isReviewError } from '../services/ai/apiErrors';
import { SecretsService } from '../services/secretsService';

export class CodeReviewWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiCodeReview.sidebar';

  private view?: vscode.WebviewView;
  private files: ModifiedFile[] = [];
  private isReviewing = false;
  private lastReview: ReviewResult | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      void this.handleMessage(message);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        void this.refreshFiles().then(() => this.postState());
      }
    });

    this.context.secrets.onDidChange((e) => {
      if (e.key.startsWith('aiCodeReview.apiKey.')) {
        this.postState();
      }
    });
  }

  async refreshFromCommand(): Promise<void> {
    await this.refreshFiles();
    this.postState();
  }

  private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.type) {
      case 'ready':
      case 'getState':
        await this.refreshFiles();
        this.postState();
        break;
      case 'setProvider': {
        await this.updateConfig('aiCodeReview.provider', message.provider);
        const config = vscode.workspace.getConfiguration();
        const modelKey =
          message.provider === 'gemini' ? 'aiCodeReview.geminiModel' : 'aiCodeReview.claudeModel';
        const currentModel = config.get<string>(modelKey) ?? '';
        if (!isKnownModel(message.provider, currentModel)) {
          await this.updateConfig(modelKey, defaultModelForProvider(message.provider));
        }
        this.postState();
        break;
      }
      case 'setModel': {
        const modelKey =
          message.provider === 'gemini' ? 'aiCodeReview.geminiModel' : 'aiCodeReview.claudeModel';
        await this.updateConfig(modelKey, message.model);
        this.postState();
        break;
      }
      case 'setApiKey':
        await SecretsService.fromContext(this.context).setApiKey(
          message.provider,
          message.apiKey,
        );
        this.postState();
        break;
      case 'clearApiKey':
        await SecretsService.fromContext(this.context).clearApiKey(message.provider);
        this.postState();
        break;
      case 'setLanguage':
        await this.updateConfig('aiCodeReview.language', message.language);
        await vscode.commands.executeCommand(
          'vscode.setContext',
          'aiCodeReview.language',
          message.language,
        );
        this.postState();
        break;
      case 'refreshFiles':
        await this.refreshFiles();
        this.post({ type: 'filesUpdated', files: this.files });
        this.postState();
        break;
      case 'toggleFile':
        this.files = this.files.map((file) =>
          file.path === message.path ? { ...file, selected: message.selected } : file,
        );
        this.postState();
        break;
      case 'selectAll':
        this.files = this.files.map((file) => ({ ...file, selected: message.selected }));
        this.postState();
        break;
      case 'runReview':
        await this.runReview();
        break;
    }
  }

  private async runReview(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.post({ type: 'reviewFailed', error: 'No workspace folder open.' });
      return;
    }

    const config = vscode.workspace.getConfiguration();
    const provider = (config.get<ProviderId>('aiCodeReview.provider') ?? 'gemini') as ProviderId;

    this.isReviewing = true;
    this.post({ type: 'reviewStarted' });
    this.postState();

    try {
      const gitService = new GitService(folder.uri.fsPath);
      const reviewService = new ReviewService(
        gitService,
        SecretsService.fromContext(this.context),
        config,
        folder.uri.fsPath,
      );

      const result = await reviewService.runReview(provider, this.files);
      this.lastReview = result;
      this.post({ type: 'reviewCompleted', result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorCode = isReviewError(error) ? error.code : undefined;
      this.post({ type: 'reviewFailed', error: message, errorCode });
    } finally {
      this.isReviewing = false;
      this.postState();
    }
  }

  private async refreshFiles(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.files = [];
      return;
    }

    const previousSelection = new Map(
      this.files.map((file) => [file.path, file.selected] as const),
    );

    const gitService = new GitService(folder.uri.fsPath);
    const discovered = await gitService.listModifiedFiles();

    this.files = discovered.map((file) => ({
      ...file,
      selected: previousSelection.get(file.path) ?? file.selected,
    }));
  }

  private async buildState(): Promise<WebviewState> {
    const config = vscode.workspace.getConfiguration();
    const secrets = SecretsService.fromContext(this.context);
    const folder = vscode.workspace.workspaceFolders?.[0];

    const [hasGeminiKey, hasClaudeKey, geminiKeyHint, claudeKeyHint] = await Promise.all([
      secrets.hasApiKey('gemini'),
      secrets.hasApiKey('claude'),
      secrets.getApiKeyHint('gemini'),
      secrets.getApiKeyHint('claude'),
    ]);

    return {
      provider: (config.get<ProviderId>('aiCodeReview.provider') ?? 'gemini') as ProviderId,
      language: (config.get<'en' | 'pt'>('aiCodeReview.language') ?? 'en') as 'en' | 'pt',
      hasGeminiKey,
      hasClaudeKey,
      geminiKeyHint,
      claudeKeyHint,
      files: this.files,
      selectedPaths: this.files.filter((f) => f.selected).map((f) => f.path),
      workspaceName: folder?.name ?? null,
      isReviewing: this.isReviewing,
      lastReview: this.lastReview,
      geminiModel: config.get<string>('aiCodeReview.geminiModel') ?? DEFAULT_GEMINI_MODEL,
      claudeModel: config.get<string>('aiCodeReview.claudeModel') ?? DEFAULT_CLAUDE_MODEL,
    };
  }

  private postState(): void {
    void this.buildState().then((payload) => {
      this.post({ type: 'state', payload });
    });
  }

  private post(message: ExtensionToWebviewMessage): void {
    void this.view?.webview.postMessage(message);
  }

  private async updateConfig<T>(key: string, value: T): Promise<void> {
    await vscode.workspace.getConfiguration().update(key, value, true);
  }

  private getHtml(webview: vscode.Webview): string {
    const webviewDist = path.join(this.extensionUri.fsPath, 'dist', 'webview');
    const indexPath = path.join(webviewDist, 'index.html');

    if (!fs.existsSync(indexPath)) {
      return this.fallbackHtml();
    }

    let html = fs.readFileSync(indexPath, 'utf8');
    const baseUri = webview.asWebviewUri(vscode.Uri.file(webviewDist));

    html = html.replace(
      /(href|src)="([^"]+)"/g,
      (_match, attr: string, asset: string) => {
        if (asset.startsWith('http') || asset.startsWith('data:')) {
          return _match;
        }
        const normalized = asset.replace(/^\.\//, '');
        return `${attr}="${baseUri}/${normalized}"`;
      },
    )
      .replace(
        '</head>',
        `<script>window.__VSCODE_WEBVIEW__ = true;</script>\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};"></head>`,
      );

    return html;
  }

  private fallbackHtml(): string {
    return `<!DOCTYPE html>
<html><body style="font-family: sans-serif; padding: 1rem;">
  <p>Webview UI not built yet.</p>
  <p>Run <code>npm run build</code> in the extension root.</p>
</body></html>`;
  }
}
