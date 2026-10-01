import type { FileReviewFinding, ReviewLanguage, ReviewResult } from './types';

type Severity = FileReviewFinding['severity'];

/** Severities worth asking an AI to fix — `info` is informational only */
const ACTIONABLE: Severity[] = ['critical', 'warning', 'suggestion'];

const COPY: Record<
  ReviewLanguage,
  {
    severity: Record<Severity, string>;
    intro: string;
    rules: string[];
    findingsHeading: string;
    line: string;
  }
> = {
  en: {
    severity: { critical: 'CRITICAL', warning: 'WARNING', suggestion: 'SUGGESTION', info: 'INFO' },
    intro:
      'A code review of my current git diff found the issues below. Fix them directly in the code.',
    rules: [
      'Fix in priority order: CRITICAL first, then WARNING, then SUGGESTION.',
      'Open each file and confirm the issue still exists before changing it; skip false positives and tell me why.',
      'Keep changes minimal and scoped to each issue — no unrelated refactors.',
      'Preserve the existing code style and conventions.',
      'When done, list what you changed per file and anything you skipped.',
    ],
    findingsHeading: 'Issues',
    line: 'line',
  },
  pt: {
    severity: { critical: 'CRÍTICO', warning: 'AVISO', suggestion: 'SUGESTÃO', info: 'INFO' },
    intro:
      'Um code review do meu git diff atual encontrou os problemas abaixo. Corrija-os diretamente no código.',
    rules: [
      'Corrija por prioridade: CRÍTICO primeiro, depois AVISO, depois SUGESTÃO.',
      'Abra cada arquivo e confirme que o problema ainda existe antes de alterar; ignore falsos positivos e explique por quê.',
      'Faça mudanças mínimas e restritas a cada problema — sem refatorações não relacionadas.',
      'Mantenha o estilo e as convenções do código existente.',
      'Ao terminar, liste o que mudou em cada arquivo e o que foi ignorado.',
    ],
    findingsHeading: 'Problemas',
    line: 'linha',
  },
};

export function countActionableFindings(result: ReviewResult): number {
  return result.files.reduce(
    (total, file) => total + file.findings.filter((f) => ACTIONABLE.includes(f.severity)).length,
    0,
  );
}

/** Builds a copy-paste prompt asking an AI coding assistant to fix the review findings */
export function buildFixPrompt(result: ReviewResult, language: ReviewLanguage): string {
  const copy = COPY[language];
  const sections: string[] = [];

  for (const file of result.files) {
    const findings = file.findings
      .filter((f) => ACTIONABLE.includes(f.severity))
      .sort((a, b) => ACTIONABLE.indexOf(a.severity) - ACTIONABLE.indexOf(b.severity));
    if (findings.length === 0) {
      continue;
    }

    const items = findings.map((f) => {
      const location = f.line !== undefined ? ` (${copy.line} ${f.line})` : '';
      return `- [${copy.severity[f.severity]}]${location} ${f.title}\n  ${f.detail}`;
    });
    sections.push(`### ${file.path}\n${items.join('\n')}`);
  }

  return [
    copy.intro,
    copy.rules.map((rule) => `- ${rule}`).join('\n'),
    `## ${copy.findingsHeading}`,
    ...sections,
  ].join('\n\n');
}
