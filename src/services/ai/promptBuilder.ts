import type { ReviewRequest } from '../../shared/types';

const JSON_SCHEMA = `{
  "qualityScore": 0,
  "overallSummary": "string",
  "files": [
    {
      "path": "relative/file/path",
      "qualityScore": 0,
      "summary": "string",
      "findings": [
        {
          "severity": "critical|warning|suggestion|info",
          "title": "string",
          "detail": "string",
          "line": 0
        }
      ]
    }
  ]
}`;

const LANGUAGE_RULES: Record<ReviewRequest['language'], string> = {
  en: 'Write ALL human-readable text (overallSummary, file summaries, finding titles and details) in English.',
  pt: 'Escreva TODO o texto legível (overallSummary, resumos dos arquivos, títulos e detalhes dos achados) em português brasileiro.',
};

export function buildReviewPrompt(request: ReviewRequest): string {
  const fileBlocks = request.files
    .map(
      (file) =>
        `### ${file.path} (${file.status})\n\`\`\`diff\n${truncateDiff(file.diff)}\n\`\`\``,
    )
    .join('\n\n');

  const contextSection =
    request.contextDocs && request.contextDocs.length > 0
      ? `### REPOSITORY BUSINESS RULES & GUIDELINES (EXTRACTED FROM AGENTS.md / DOCS):
The following business rules, architecture requirements, and project conventions were found in the repository documentation:

${request.contextDocs
  .map((doc) => `#### File: ${doc.path}\n\`\`\`markdown\n${doc.content}\n\`\`\``)
  .join('\n\n')}

IMPORTANT: Cross-check every change in the diff against these business rules and repository guidelines. Any violation or omission of these rules must be reported as a finding.`
      : `### REPOSITORY BUSINESS RULES & CONTEXT:
No specific AGENTS.md or rule documentation files were found in the workspace root. Review the code based on the context of the diff, domain conventions, and software engineering standards.`;

  const followUpSection = request.aiFeedback
    ? `\n### PREVIOUS ROUND FEEDBACK & ASSISTANT JUSTIFICATIONS:
The developer asked an AI coding assistant to apply fixes from the previous review round.
The assistant reported the following actions, explanations, and claims of "false positives":

"""
${request.aiFeedback}
"""

RE-REVIEW MANDATE & VALIDATION CRITERIA:
1. Scrutinize the Assistant's Justifications for Ignored Items:
   - For every item the assistant claims is a "false positive" or chose to ignore, evaluate whether the assistant's argument is technically sound and safe in this codebase.
   - If the assistant's justification is valid and correct: Accept it and do NOT report it as an issue.
   - If the assistant's justification is flawed, incorrect, or masks a real production risk/regression: Explicitly flag it as a finding, explaining why the assistant's reasoning is wrong and what must be fixed.
2. Verify the Applied Fixes:
   - Verify that the changes the assistant claimed to make were implemented properly without introducing new bugs or regressions.
3. In overallSummary, provide a clear verdict on whether the assistant's fixes and justifications make sense.\n`
    : '';

  return `You are a Principal Software Engineer performing a rigorous, high-value, and actionable code review on a git diff.

${contextSection}
${followUpSection}
REVIEW OBJECTIVES & FOCUS AREAS:
1. Business Logic & Invariants:
   - Validate that the changes adhere to business rules defined above (from AGENTS.md / docs).
   - Verify domain invariants, validation rules, state transitions, and business flow.
2. Correctness & Edge Cases:
   - Identify bugs, inverted logic, incorrect comparisons, off-by-one errors, or improper null/undefined handling.
   - Check asynchronous flows: race conditions, unhandled rejections, missing await, or concurrency conflicts.
3. Architecture & API Contracts:
   - Check for broken interfaces, renamed/removed parameters that break callers, circular dependencies, or improper abstraction leaks.
4. Error Handling & Robustness:
   - Verify proper error recovery, graceful degradation, and correct mapping of HTTP status codes or exceptions.
5. Performance & Resource Leaks:
   - Look for uncancelled timers/listeners, memory leaks, redundant heavy renders, or unneeded network requests.
6. Security & Authorization:
   - Check for auth token mishandling, insecure endpoints, exposed sensitive info, or injection vulnerabilities.

FEEDBACK STANDARDS:
- Provide high-signal, professional, and constructive feedback.
- Avoid trivial cosmetic nitpicks (such as indentation or minor whitespace styling).
- For each finding, clearly explain:
  1. Title: Short, descriptive summary of the problem.
  2. Detail: (a) The concrete issue/risk, (b) Why it matters or what breaks, (c) The recommended fix.
  3. Line: The approximate line number in the modified code (if identifiable).
- If a file is clean and has no issues, set its "findings" array to [] and award a high qualityScore.
- You MUST include every reviewed file in the "files" array.

SEVERITY LEVELS:
- critical: Severe bugs that crash production, corrupt data, bypass auth, or violate core business rules.
- warning: High-risk logic flaws, race conditions, unhandled edge cases, or significant regressions.
- suggestion: Actionable improvements in architecture, robustness, typing precision, or performance.
- info: Notable architectural notes, migration caveats, or contextual remarks.

SCORING (qualityScore):
- 100: Clean, robust code with zero findings or bugs.
- 90-99: Solid implementation with minor suggestions or small non-critical improvements.
- 70-89: Contains verifiable logic flaws, edge-case risks, or missing error handling.
- 0-69: Critical bugs, security flaws, or fatal regressions.

MANDATORY RULES:
- Output ONLY valid JSON matching the schema below.
- Do NOT wrap with commentary or markdown outside the JSON.
- Every changed file must have its own entry in the "files" array.

LANGUAGE (mandatory):
${LANGUAGE_RULES[request.language]}

JSON SCHEMA:
${JSON_SCHEMA}

Review the following ${request.files.length} changed file(s):

${fileBlocks}`;
}

function truncateDiff(diff: string, maxChars = 12000): string {
  if (diff.length <= maxChars) {
    return diff;
  }
  return `${diff.slice(0, maxChars)}\n... [truncated]`;
}
