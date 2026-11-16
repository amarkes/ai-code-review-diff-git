import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface ContextDoc {
  path: string;
  content: string;
}

/** Primary rule and instruction files, checked in order of priority */
const PRIMARY_RULE_FILES = [
  'AGENTS.md',
  'agents.md',
  '.agents.md',
  'CLAUDE.md',
  'claude.md',
  '.cursorrules',
  '.windsurfrules',
  path.join('.github', 'copilot-instructions.md'),
];

/** Maximum character budget across all injected docs to avoid token exhaustion */
const MAX_TOTAL_CHARS = 32_000;
/** Maximum character budget per single doc */
const MAX_DOC_CHARS = 10_000;

/**
 * Searches for AGENTS.md, business rule files, and project documentation (.md)
 * in the workspace to inject into the review prompt as business context.
 */
export async function collectRepositoryContext(workspaceRoot: string): Promise<ContextDoc[]> {
  const docs: ContextDoc[] = [];
  let totalChars = 0;

  // 1. High-priority rule files (e.g. AGENTS.md, CLAUDE.md, etc.)
  for (const relPath of PRIMARY_RULE_FILES) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    const fullPath = path.join(workspaceRoot, relPath);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        const raw = await fs.readFile(fullPath, 'utf-8');
        const trimmed = raw.trim();
        if (trimmed) {
          const allowed = Math.min(MAX_DOC_CHARS, MAX_TOTAL_CHARS - totalChars);
          const content = trimmed.length > allowed
            ? `${trimmed.slice(0, allowed)}\n... [truncated]`
            : trimmed;
          docs.push({ path: relPath, content });
          totalChars += content.length;
        }
      }
    } catch {
      // File does not exist or unreadable, ignore
    }
  }

  // 2. Check for relevant documentation in docs/ and root README.md
  if (totalChars < MAX_TOTAL_CHARS) {
    const candidates: string[] = [];

    // Check docs directory if present
    const docsDir = path.join(workspaceRoot, 'docs');
    try {
      const stat = await fs.stat(docsDir);
      if (stat.isDirectory()) {
        const entries = await fs.readdir(docsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            candidates.push(path.join('docs', entry.name));
          }
        }
      }
    } catch {
      // docs dir does not exist
    }

    // Root README.md
    candidates.push('README.md');

    for (const relPath of candidates) {
      if (totalChars >= MAX_TOTAL_CHARS) break;
      if (docs.some((d) => d.path.toLowerCase() === relPath.toLowerCase())) continue;

      const fullPath = path.join(workspaceRoot, relPath);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          const raw = await fs.readFile(fullPath, 'utf-8');
          const trimmed = raw.trim();
          if (trimmed) {
            const allowed = Math.min(MAX_DOC_CHARS, MAX_TOTAL_CHARS - totalChars);
            const content = trimmed.length > allowed
              ? `${trimmed.slice(0, allowed)}\n... [truncated]`
              : trimmed;
            docs.push({ path: relPath, content });
            totalChars += content.length;
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  return docs;
}
