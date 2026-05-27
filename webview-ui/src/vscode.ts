import type { WebviewApi } from 'vscode-webview';
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '@shared/messages';

declare global {
  interface Window {
    acquireVsCodeApi?: () => WebviewApi<WebviewToExtensionMessage>;
  }
}

let api: WebviewApi<WebviewToExtensionMessage> | undefined;

export function getVsCodeApi(): WebviewApi<WebviewToExtensionMessage> | undefined {
  if (!api && typeof window !== 'undefined' && window.acquireVsCodeApi) {
    api = window.acquireVsCodeApi();
  }
  return api;
}

export function postMessage(message: WebviewToExtensionMessage): void {
  getVsCodeApi()?.postMessage(message);
}

export function onExtensionMessage(
  handler: (message: ExtensionToWebviewMessage) => void,
): () => void {
  const listener = (event: MessageEvent<ExtensionToWebviewMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
