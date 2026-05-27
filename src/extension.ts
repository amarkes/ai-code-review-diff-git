import * as vscode from 'vscode';
import { CodeReviewWebviewProvider } from './webview/CodeReviewWebviewProvider';

let webviewProvider: CodeReviewWebviewProvider | undefined;

export function activate(context: vscode.ExtensionContext): void {
  webviewProvider = new CodeReviewWebviewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CodeReviewWebviewProvider.viewType,
      webviewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
    vscode.commands.registerCommand('aiCodeReview.openPanel', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.ai-code-review');
    }),
    vscode.commands.registerCommand('aiCodeReview.refreshFiles', async () => {
      await webviewProvider?.refreshFromCommand();
    }),
  );
}

export function deactivate(): void {
  webviewProvider = undefined;
}
