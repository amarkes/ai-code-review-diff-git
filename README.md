# AI Code Review

Extensão para **VS Code** e **Cursor** que revisa arquivos modificados no workspace usando **Google Gemini** ou **Anthropic Claude**.

## Funcionalidades

- Lista arquivos alterados via Git (modificados, novos, removidos, etc.)
- Seleção de arquivos para revisão
- Chaves de API armazenadas com segurança (`SecretStorage` do VS Code)
- UI em React + Tailwind na sidebar
- Internacionalização (inglês e português)

## Requisitos

- Node.js 18+
- Git instalado e repositório no workspace aberto
- Chave de API do [Google AI Studio](https://aistudio.google.com/apikey) (Gemini) ou [Anthropic Console](https://console.anthropic.com/) (Claude)

## Desenvolvimento

```bash
npm install
npm run build
```

Para desenvolvimento com watch:

```bash
npm run watch
```

### Executar na IDE

1. Abra esta pasta no VS Code ou Cursor
2. `F5` ou **Run Extension** (`.vscode/launch.json`)
3. Na janela de extensão, abra um projeto com alterações Git
4. Clique no ícone **AI Code Review** na barra lateral

## Uso

1. Configure o provedor (Gemini ou Claude)
2. Cole e salve a chave de API (não fica em arquivos do projeto)
3. Atualize a lista de arquivos modificados
4. Selecione os arquivos e clique em **Run review** / **Executar revisão**

## Configurações

| Chave | Descrição | Padrão |
|-------|-----------|--------|
| `aiCodeReview.provider` | `gemini` ou `claude` | `gemini` |
| `aiCodeReview.geminiModel` | Modelo Gemini | `gemini-2.5-flash-lite` (mais barato) |
| `aiCodeReview.claudeModel` | Modelo Claude | `claude-3-5-haiku-20241022` (mais barato) |
| `aiCodeReview.language` | `en` ou `pt` | `en` |

## Estrutura do projeto

```
src/                 # Extension host (TypeScript)
  extension.ts
  services/          # Git, secrets, review, AI providers
  webview/           # Webview provider
  shared/            # Tipos e mensagens compartilhados
webview-ui/          # React + Tailwind + i18next
dist/                # Build de produção
```

## Empacotar

```bash
./build.sh
```

O script interativo (igual ao do projeto 4096):

1. Escolhe bump de versão (patch / minor / major)
2. Pede linhas para o `CHANGELOG.md`
3. Atualiza `package.json`
4. Roda `npm run compile` (build da extensão + webview)
5. Gera `ai-code-review-diff-git-X.Y.Z.vsix` na raiz do projeto

Alternativa manual:

```bash
npm run compile
npm run package
```

Instale o `.vsix` no VS Code/Cursor via **Extensions: Install from VSIX**.

## Segurança

- As chaves de API são guardadas no armazenamento seguro da IDE, não em `.env` nem no código
- Os diffs são enviados apenas para o provedor escolhido durante a revisão
- Revise as políticas de dados da Anthropic/Google antes de usar em código proprietário

## Licença

MIT
