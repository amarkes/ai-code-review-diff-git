/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: 'var(--vscode-editor-background)',
          fg: 'var(--vscode-editor-foreground)',
          border: 'var(--vscode-panel-border)',
          button: 'var(--vscode-button-background)',
          buttonHover: 'var(--vscode-button-hoverBackground)',
          buttonFg: 'var(--vscode-button-foreground)',
          input: 'var(--vscode-input-background)',
          inputBorder: 'var(--vscode-input-border)',
          muted: 'var(--vscode-descriptionForeground)',
          focus: 'var(--vscode-focusBorder)',
          error: 'var(--vscode-errorForeground)',
          warning: 'var(--vscode-editorWarning-foreground)',
        },
      },
    },
  },
  plugins: [],
};
